import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const categories = ["ثقافة عامة","علوم","تاريخ","جغرافيا","المغرب","سينما","ألغاز"];
const difficulties = ["سهل","متوسط","صعب"];
const schema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: 15,
      maxItems: 15,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          explanation: { type: "string" },
          category: { type: "string", enum: categories },
          difficulty: { type: "string", enum: difficulties }
        },
        required: ["question","answer","explanation","category","difficulty"],
        additionalProperties: false
      }
    }
  },
  required: ["questions"],
  additionalProperties: false
};
const gradeSchema = {
  type: "object",
  properties: {
    correct: { type: "boolean" },
    feedback: { type: "string" }
  },
  required: ["correct","feedback"],
  additionalProperties: false
};
async function openAI(input: string, formatName: string, formatSchema: unknown) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY غير مضبوط في Supabase.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input,
      text: { format: { type: "json_schema", name: formatName, strict: true, schema: formatSchema } },
      store: false
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "تعذر الاتصال بخدمة الأسئلة الذكية.");
  const text = data.output?.flatMap((o: any) => o.content || []).find((c: any) => c.type === "output_text")?.text;
  if (!text) throw new Error("لم يصل رد صالح من نموذج الأسئلة.");
  return JSON.parse(text);
}
function normalize(v: string) {
  return String(v || "").normalize("NFKC").toLocaleLowerCase("ar")
    .replace(/[ًٌٍَُِّْـٰ]/g, "").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي")
    .replace(/ة/g,"ه").replace(/[^\p{L}\p{N}]+/gu," ").trim();
}

async function gradeSession(admin: any, session: any) {
  if (session.status === "revealed") return { submitted: true, waiting: false, results: session.results, index: session.current_index, total: 15 };
  if (session.status !== "active" || !session.submissions?.ayoub || !session.submissions?.farhati) {
    return { submitted: true, waiting: true, status: session.status, index: session.current_index, total: 15 };
  }
  const { data: claimed, error: claimError } = await admin.rpc("ayfar_ai_quiz_claim_grading", { p_session_id: session.id });
  if (claimError) throw claimError;
  if (!claimed) {
    const { data: latest, error } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id", session.id).single();
    if (error) throw error;
    if (latest.status === "revealed") return { submitted: true, waiting: false, results: latest.results, index: latest.current_index, total: 15 };
    return { submitted: true, waiting: true, status: latest.status, index: latest.current_index, total: 15 };
  }
  const q = claimed.questions[claimed.current_index];
  const judged = await Promise.all(["ayoub", "farhati"].map(async (p) => {
    let correct = normalize(claimed.submissions[p]) === normalize(q.answer);
    let feedback = correct ? "إجابة صحيحة، أحسنت!" : "ليست الإجابة المطابقة للإجابة النموذجية.";
    if (Deno.env.get("AYFAR_AI_GRADING_ENABLED") === "true") {
      try {
        const out = await openAI(`قيّم إجابة اللاعب في مسابقة ثقافة عامة. السؤال: ${q.question}. الإجابة النموذجية: ${q.answer}. إجابة اللاعب: ${claimed.submissions[p]}. اعتبر المرادفات والصياغات المختلفة صحيحة إذا كان المعنى صحيحاً. لا تقبل إجابة تناقض الحقيقة. أعد JSON فيه correct وfeedback بالعربية بجملة قصيرة.`, "ayfar_answer_grade", gradeSchema);
        correct = out.correct;
        feedback = out.feedback;
      } catch (error) {
        console.warn("AI grading unavailable; using local answer matching:", error);
      }
    }
    return { answer: claimed.submissions[p], correct, feedback, points: correct ? 2 : 0 };
  }));
  const results = { ayoub: judged[0], farhati: judged[1], correctAnswer: q.answer, explanation: q.explanation };
  const { data: saved, error: saveError } = await admin.from("ayfar_ai_quiz_sessions")
    .update({ results, status: "revealed", grading_started_at: null, updated_at: new Date().toISOString() })
    .eq("id", claimed.id).eq("status", "active").eq("grading_started_at", claimed.grading_started_at)
    .select("id").maybeSingle();
  if (saveError) throw saveError;
  if (!saved) {
    const { data: latest, error } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id", claimed.id).single();
    if (error) throw error;
    if (latest.status === "revealed") return { submitted: true, waiting: false, results: latest.results, index: latest.current_index, total: 15 };
    return { submitted: true, waiting: true, status: latest.status, index: latest.current_index, total: 15 };
  }
  return { submitted: true, waiting: false, results, index: claimed.current_index, total: 15 };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "يجب تسجيل الدخول." }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "جلسة الدخول غير صالحة." }, 401);
    const admin = createClient(url, service);
    const body = await req.json();
    const { action, gameId, sessionId, answer, categories: requestedCats, difficulty, localQuestions } = body;
    const userId = userData.user.id;

    let resolvedGameId = gameId;
    if (!resolvedGameId && sessionId) {
      const { data: linkedSession } = await admin.from("ayfar_ai_quiz_sessions").select("game_id").eq("id", sessionId).maybeSingle();
      resolvedGameId = linkedSession?.game_id;
    }
    if (!resolvedGameId) return json({ error: "معرّف المباراة أو الجلسة غير صالح." }, 400);
    const { data: game, error: gameError } = await admin.from("ayfar_games").select("id,game_key,status,host_id,guest_id,state").eq("id", resolvedGameId).single();
    if (gameError || !game || ![game.host_id, game.guest_id].includes(userId)) return json({ error: "المباراة غير موجودة أو لست مشاركاً فيها." }, 403);
    if (game.game_key !== "riddles" || game.status !== "playing" || !game.state?.aiQuiz) return json({ error: "هذه المباراة ليست في وضع المسابقة الذكية." }, 400);
    const { data: profile, error: profileError } = await admin.from("profiles").select("role").eq("id", userId).single();
    if (profileError) throw profileError;
    const rawRole = String(profile?.role || "").toLowerCase();
    const role = rawRole === "farahati" ? "farhati" : rawRole;
    if (!["ayoub", "farhati"].includes(role)) return json({ error: "الحساب غير مخوّل." }, 403);
    if (action === "create") {
      const { data: existing } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("game_id", game.id).maybeSingle();
      if (existing) {
        const q = existing.questions?.[existing.current_index];
        return json({ sessionId: existing.id, index: existing.current_index, total: 15, question: q?.question || "", options: q?.options || [], category: q?.category || "", difficulty: q?.difficulty || "", status: existing.status, submissions: { ayoub: !!existing.submissions?.ayoub, farhati: !!existing.submissions?.farhati }, results: existing.results || null });
      }
      const cats = Array.isArray(requestedCats) ? requestedCats.filter((c: string) => categories.includes(c)) : categories;
      if (!cats.length) return json({ error: "اختر تصنيفاً واحداً على الأقل." }, 400);
      const level = ["متنوع", ...difficulties].includes(difficulty) ? difficulty : "متنوع";
      const prompt = `أنشئ مسابقة عربية أصلية من 15 سؤالاً بالضبط، متنوعة وغير مكررة داخل المجموعة. استخدم التصنيفات التالية فقط: ${cats.join("، ")}. مستوى الصعوبة: ${level === "متنوع" ? "وزع الأسئلة على السهل والمتوسط والصعب" : level}. اجعل الأسئلة دقيقة وذات إجابة محددة ومعلومة عامة مستقرة، وضمن المغرب وأسئلته عند اختيار تصنيف المغرب. لا تخترع حقائق أو أسئلة ملتبسة. أخرج JSON فقط وفق المخطط.`;
      let questions: any[] | null = null;
      if (Array.isArray(localQuestions) && localQuestions.length === 15) {
        const valid = localQuestions.every((q: any) =>
          q && typeof q.question === "string" && q.question.trim() &&
          typeof q.answer === "string" && q.answer.trim() &&
          typeof q.explanation === "string" &&
          Array.isArray(q.options) && q.options.length >= 2 &&
          q.options.every((v: any) => typeof v === "string")
        );
        if (valid) questions = localQuestions.map((q: any) => ({
          question: q.question.slice(0, 500), answer: q.answer.slice(0, 160),
          explanation: q.explanation.slice(0, 500), category: categories.includes(q.category) ? q.category : "ثقافة عامة",
          difficulty: difficulties.includes(q.difficulty) ? q.difficulty : "متوسط",
          options: q.options.slice(0, 4).map((v: string) => v.slice(0, 160))
        }));
      }
      if (!questions) {
        try {
          const generated = await openAI(prompt, "ayfar_quiz", schema);
          questions = generated.questions;
        } catch (error) {
          console.warn("AI question generation unavailable; no local question payload was supplied:", error);
          throw new Error("تعذر إنشاء الأسئلة. حدّث الموقع وحاول مجدداً لاستخدام بنك الأسئلة المجاني.");
        }
      }
      const { data: session, error } = await admin.from("ayfar_ai_quiz_sessions").insert({
        game_id: game.id, questions, current_index: 0, submissions: {}, status: "active"
      }).select("*").single();
      if (error) {
        if (error.code === "23505") {
          const { data: raced } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("game_id", game.id).single();
          if (raced) {
            const q = raced.questions?.[raced.current_index];
            return json({ sessionId: raced.id, index: raced.current_index, total: 15, question: q?.question || "", options: q?.options || [], category: q?.category || "", difficulty: q?.difficulty || "", status: raced.status, submissions: { ayoub: !!raced.submissions?.ayoub, farhati: !!raced.submissions?.farhati }, results: raced.results || null });
          }
        }
        throw error;
      }
      const q = session.questions[0];
      return json({ sessionId: session.id, index: 0, total: 15, question: q.question, options: q.options || [], category: q.category, difficulty: q.difficulty, status: session.status, submissions: { ayoub: false, farhati: false }, results: null });
    }

    const { data: session, error: sessionError } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id", sessionId).eq("game_id", game.id).single();
    if (sessionError || !session) return json({ error: "جلسة المسابقة غير موجودة." }, 404);

    if (action === "status") {
      let latest = session;
      if (latest.status === "active" && latest.submissions?.ayoub && latest.submissions?.farhati) {
        const outcome = await gradeSession(admin, latest);
        if (!outcome.waiting) return json({ ...outcome, status: "revealed" });
        const { data: refreshed } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id", session.id).single();
        if (refreshed) latest = refreshed;
      }
      const q = latest.questions?.[latest.current_index];
      return json({ status: latest.status, index: latest.current_index, total: 15, question: q?.question || "", options: q?.options || [], category: q?.category || "", difficulty: q?.difficulty || "", submissions: { ayoub: !!latest.submissions?.ayoub, farhati: !!latest.submissions?.farhati }, results: latest.results || null });
    }

    if (action === "submit") {
      if (session.status !== "active") {
        if (session.status === "revealed") return json({ submitted: true, waiting: false, results: session.results, index: session.current_index, total: 15 });
        return json({ error: "هذه الجولة مكتملة بالفعل." }, 409);
      }
      const cleanAnswer = String(answer || "").trim().slice(0, 240);
      if (!cleanAnswer && !session.submissions?.[role]) return json({ error: "اكتب إجابتك أولاً." }, 400);
      let latest = session;
      if (!latest.submissions?.[role]) {
        const { data: submittedSession, error: submissionError } = await admin.rpc("ayfar_ai_quiz_submit_answer", {
          p_session_id: session.id, p_role: role, p_answer: cleanAnswer
        });
        if (submissionError) {
          const { data: refreshed } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id", session.id).single();
          if (!refreshed || !refreshed.submissions?.[role]) return json({ error: submissionError.message || "تعذر حفظ الإجابة." }, 409);
          latest = refreshed;
        } else if (submittedSession) latest = submittedSession;
      }
      if (!latest.submissions?.ayoub || !latest.submissions?.farhati) return json({ submitted: true, waiting: true, status: latest.status });
      return json(await gradeSession(admin, latest));
    }

    if (action === "next") {
      if (role !== "ayoub") return json({ error: "أيوب فقط يمكنه الانتقال للسؤال التالي." }, 403);
      if (session.status === "finished") return json({ finished: true, total: 15 });
      if (session.status !== "revealed") return json({ error: "لم تُكشف نتيجة الجولة بعد." }, 409);
      const nextIndex = session.current_index + 1;
      if (nextIndex >= 15) {
        const { data: finished, error } = await admin.from("ayfar_ai_quiz_sessions").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id",session.id).eq("status","revealed").eq("current_index",session.current_index).select("id").maybeSingle();
        if (error) throw error;
        if (!finished) {
          const { data: latest } = await admin.from("ayfar_ai_quiz_sessions").select("status").eq("id",session.id).single();
          if (latest?.status !== "finished") return json({ error: "تعذر إنهاء المسابقة؛ حدّث الصفحة وحاول مجدداً." }, 409);
        }
        return json({ finished: true, total: 15 });
      }
      const next = session.questions[nextIndex];
      const { data: advanced, error } = await admin.from("ayfar_ai_quiz_sessions").update({ current_index: nextIndex, submissions: {}, results: null, grading_started_at: null, status: "active", updated_at: new Date().toISOString() }).eq("id",session.id).eq("status","revealed").eq("current_index",session.current_index).select("id").maybeSingle();
      if (error) throw error;
      if (!advanced) {
        const { data: latest } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id",session.id).single();
        if (latest?.status === "active") {
          const currentQuestion = latest.questions[latest.current_index];
          return json({ finished: false, index: latest.current_index, total: 15, question: currentQuestion.question, options: currentQuestion.options || [], category: currentQuestion.category, difficulty: currentQuestion.difficulty });
        }
        return json({ error: "تعذر الانتقال؛ حدّث المسابقة وحاول مجدداً." }, 409);
      }
      return json({ finished: false, index: nextIndex, total: 15, question: next.question, options: next.options || [], category: next.category, difficulty: next.difficulty });
    }
    return json({ error: "إجراء غير معروف." }, 400);
  } catch (error) {
    console.error("ayfar-ai-quiz:", error);
    return json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع." }, 500);
  }
});
