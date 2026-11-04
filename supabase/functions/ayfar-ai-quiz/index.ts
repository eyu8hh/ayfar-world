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
    const { action, gameId, sessionId, answer, categories: requestedCats, difficulty } = await req.json();
    const userId = userData.user.id;
    const { data: game, error: gameError } = await admin.from("ayfar_games").select("id,game_key,status,host_id,guest_id").eq("id", gameId || (sessionId ? (await admin.from("ayfar_ai_quiz_sessions").select("game_id").eq("id",sessionId).single()).data?.game_id : "")).single();
    if (gameError || !game || ![game.host_id,game.guest_id].includes(userId)) return json({ error: "المباراة غير موجودة أو لست مشاركاً فيها." }, 403);
    if (game.game_key !== "riddles" || game.status !== "playing") return json({ error: "هذه المباراة ليست في وضع المسابقة الذكية." }, 400);
    const { data: profile, error: profileError } = await admin.from("profiles").select("role").eq("id",userId).single();
    if (profileError) throw profileError;
    const role = String(profile?.role || "").toLowerCase() === "farahati" ? "farhati" : String(profile?.role || "").toLowerCase();
    if (!["ayoub","farhati"].includes(role)) return json({ error: "الحساب غير مخوّل." }, 403);

    if (action === "create") {
      if (role !== "ayoub") return json({ error: "أيوب فقط يمكنه بدء المسابقة الذكية." }, 403);
      const cats = Array.isArray(requestedCats) ? requestedCats.filter((c: string) => categories.includes(c)) : categories;
      if (!cats.length) return json({ error: "اختر تصنيفاً واحداً على الأقل." }, 400);
      const level = ["متنوع", ...difficulties].includes(difficulty) ? difficulty : "متنوع";
      const prompt = `أنشئ مسابقة عربية أصلية من 15 سؤالاً بالضبط، متنوعة وغير مكررة داخل المجموعة. استخدم التصنيفات التالية فقط: ${cats.join("، ")}. مستوى الصعوبة: ${level === "متنوع" ? "وزع الأسئلة على السهل والمتوسط والصعب" : level}. اجعل الأسئلة دقيقة وذات إجابة محددة ومعلومة عامة مستقرة، وضمن المغرب وأسئلته عند اختيار تصنيف المغرب. لا تخترع حقائق أو أسئلة ملتبسة. أخرج JSON فقط وفق المخطط.`;
      const generated = await openAI(prompt, "ayfar_quiz", schema);
      const { data: session, error } = await admin.from("ayfar_ai_quiz_sessions").insert({
        game_id: game.id, questions: generated.questions, current_index: 0, submissions: {}, status: "active"
      }).select("id").single();
      if (error) throw error;
      const q = generated.questions[0];
      return json({ sessionId: session.id, index: 0, total: 15, question: q.question, category: q.category, difficulty: q.difficulty });
    }

    const { data: session, error: sessionError } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id", sessionId).eq("game_id",game.id).single();
    if (sessionError || !session) return json({ error: "جلسة المسابقة غير موجودة." }, 404);

    if (action === "submit") {
      if (session.status !== "active") return json({ error: "هذه الجولة مكتملة بالفعل." }, 409);
      const cleanAnswer = String(answer || "").trim().slice(0,240);
      if (!cleanAnswer) return json({ error: "اكتب إجابتك أولاً." }, 400);
      const { data: submittedSession, error: submissionError } = await admin.rpc("ayfar_ai_quiz_submit_answer", {
        p_session_id: session.id, p_role: role, p_answer: cleanAnswer
      });
      if (submissionError) {
        const { data: latest } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id",session.id).maybeSingle();
        if (latest?.status === "revealed" && latest.results) return json({ submitted: true, waiting: false, results: latest.results, index: latest.current_index, total: 15 });
        if (latest?.status === "active" && latest.submissions?.[role]) return json({ submitted: true, waiting: true });
        return json({ error: submissionError.message || "تعذر حفظ الإجابة." }, 409);
      }
      if (!submittedSession) return json({ error: "تعذر حفظ الإجابة." }, 409);
      const nextSubs = submittedSession.submissions || {};
      if (!nextSubs.ayoub || !nextSubs.farahati) return json({ submitted: true, waiting: true });
      const q = submittedSession.questions[submittedSession.current_index];
      const judged = await Promise.all(["ayoub","farhati"].map(async (p) => {
        const out = await openAI(`قيّم إجابة اللاعب في مسابقة ثقافة عامة. السؤال: ${q.question}. الإجابة النموذجية: ${q.answer}. إجابة اللاعب: ${nextSubs[p]}. اعتبر المرادفات والصياغات المختلفة صحيحة إذا كان المعنى صحيحاً. لا تقبل إجابة تناقض الحقيقة. أعد JSON فيه correct وfeedback بالعربية بجملة قصيرة.`, "ayfar_answer_grade", gradeSchema);
        return { answer: nextSubs[p], correct: out.correct, feedback: out.feedback, points: out.correct ? 2 : 0 };
      }));
      const results = { ayoub: judged[0], farhati: judged[1], correctAnswer: q.answer, explanation: q.explanation };
      const saved = await admin.from("ayfar_ai_quiz_sessions").update({ results, status: "revealed", updated_at: new Date().toISOString() }).eq("id",session.id).eq("status","active").select("id").maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data) {
        const { data: latest } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id",session.id).maybeSingle();
        if (latest?.status === "revealed" && latest.results) return json({ submitted: true, waiting: false, results: latest.results, index: latest.current_index, total: 15 });
        return json({ error: "تعذر تثبيت نتيجة الجولة. أعد المحاولة." }, 409);
      }
      return json({ submitted: true, waiting: false, results, index: session.current_index, total: 15 });
    }

    if (action === "next") {
      if (role !== "ayoub") return json({ error: "أيوب فقط يمكنه الانتقال للسؤال التالي." }, 403);
      if (session.status !== "revealed") return json({ error: "لم تُكشف نتيجة الجولة بعد." }, 409);
      const nextIndex = session.current_index + 1;
      if (nextIndex >= 15) {
        const { data: finished, error } = await admin.from("ayfar_ai_quiz_sessions").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id",session.id).eq("status","revealed").eq("current_index",session.current_index).select("id").maybeSingle();
        if (error) throw error;
        if (!finished) {
          const { data: latest } = await admin.from("ayfar_ai_quiz_sessions").select("status").eq("id",session.id).maybeSingle();
          if (latest?.status !== "finished") return json({ error: "تم الانتقال بالفعل؛ حدّث المسابقة." }, 409);
        }
        return json({ finished: true, total: 15 });
      }
      const next = session.questions[nextIndex];
      const { data: advanced, error } = await admin.from("ayfar_ai_quiz_sessions").update({ current_index: nextIndex, submissions: {}, results: null, status: "active", updated_at: new Date().toISOString() }).eq("id",session.id).eq("status","revealed").eq("current_index",session.current_index).select("id").maybeSingle();
      if (error) throw error;
      if (!advanced) {
        const { data: latest } = await admin.from("ayfar_ai_quiz_sessions").select("*").eq("id",session.id).maybeSingle();
        if (latest?.status === "active") {
          const currentQuestion = latest.questions[latest.current_index];
          return json({ finished: false, index: latest.current_index, total: 15, question: currentQuestion.question, category: currentQuestion.category, difficulty: currentQuestion.difficulty });
        }
        return json({ error: "تم الانتقال بالفعل؛ أعد تحميل المسابقة." }, 409);
      }
      return json({ finished: false, index: nextIndex, total: 15, question: next.question, category: next.category, difficulty: next.difficulty });
    }
    return json({ error: "إجراء غير معروف." }, 400);
  } catch (error) {
    console.error("ayfar-ai-quiz:", error);
    return json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع." }, 500);
  }
});
