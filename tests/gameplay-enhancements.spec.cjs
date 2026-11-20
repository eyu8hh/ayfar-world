const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("who-knows game collects both answers in one view and supports peer semantic judging", async () => {
  const games = read("js/games.js");
  expect(games).toContain('id="who-self"');
  expect(games).toContain('id="who-guess"');
  expect(games).toContain('id="who-submit"');
  expect(games).toContain('data-who-judge="yes"');
  expect(games).toContain('data-who-judge="no"');
  expect(games).toContain("whoJudgments");
  expect(games).toContain('id="actual-choice"');
  expect(games).toContain('id="prediction"');
  expect(games).toContain("canonicalRole");
});

test("game chat reactions are stored in the shared match state", async () => {
  const games = read("js/games.js");
  expect(games).toContain("data-chat-react");
  expect(games).toContain("message.reactions[emoji]");
  expect(games).toContain("actors.filter(actor=>actor!==role)");
});

test("game chat reaction retries preserve the originally requested state", async () => {
  const games = read("js/games.js");
  expect(games).toContain('shouldReact=!button.classList.contains("is-active")');
  expect(games).toContain("message.reactions[emoji]=shouldReact?");
  expect(games).toContain("actors.includes(role)?actors:[...actors,role]");
});

test("match creation no longer blocks an additional active room", async () => {
  const games = read("js/games.js");
  const migration = read("supabase/migrations/202611070001_allow_multiple_active_games.sql");
  expect(games).toContain("Detach this tab");
  expect(migration).toContain("ayfar_challenge_send");
  expect(migration).toContain("ayfar_challenge_accept");
  expect(migration).not.toContain("لديكما مباراة نشطة بالفعل");
  expect(migration).not.toContain("لديك مباراة نشطة بالفعل");
  expect(migration).toContain("يجب كتابة سبب إضافة النجوم أو خصمها");
});

test("star changes require a reason and display their recorded time", async () => {
  const letters = read("js/love-letters.js");
  expect(letters).toContain('id="star-reason" class="text" maxlength="160" required');
  expect(letters).toContain("وقت الإضافة:");
  expect(letters).toContain("p_reason:reason");
});

test("notifications offer a contextual action and mark read on selection", async () => {
  const notifications = read("js/notifications.js");
  expect(notifications).toContain("data-notification-open");
  expect(notifications).toContain("openNotification(button.dataset.notificationOpen");
  expect(notifications).toContain('star_change:"#star-wallet"');
  expect(notifications).toContain('daily_rating:"#rating"');
  expect(notifications).toContain('pet_care:"#home-pets"');
});

test("daily letters render varied handwritten keepsake images and preserve a downloadable copy", async () => {
  const letters = read("js/love-letters.js");
  const imageCode = letters.slice(letters.indexOf("async function createDailyLetterImage"), letters.indexOf("async function renderDailyLetterImagePreview"));
  expect(imageCode).toContain('name:"linen"');
  expect(imageCode).toContain('name:"garden"');
  expect(imageCode).toContain('name:"sunset"');
  expect(imageCode).toContain('name:"bluehour"');
  expect(imageCode).toContain('name:"kraft"');
  expect(imageCode).toContain('name:"rose"');
  expect(imageCode).toContain('canvas.toBlob');
  expect(imageCode).toContain('ctx.fillText("بكل الحب، أيوب"');
  expect(letters).toContain('id="daily-letter-image-preview"');
  expect(letters).toContain("renderDailyLetterImagePreview();");
  expect(letters).toContain('link.download="ayfar-letter-"');
  expect(letters).not.toContain("GHUSEIN");
});

test("speed challenge uses a shared server timestamp and calibrated local clock", async () => {
  const games = read("js/games.js");
  expect(games).toContain("function observeServerTime(row,startedAt,endedAt)");
  expect(games).toContain('Date.parse(updated.updated_at)');
  expect(games).toContain('x.deadlineAt=null');
  expect(games).toContain('Date.now()+serverClockOffsetMs');
  expect(games).toContain('key==="speed"&&!s.deadlineAt');
  expect(games).toContain('const startedAt=Date.now();const {data,error}=await client().from("ayfar_games")');
  expect(games).toContain('observeServerTime(data,startedAt,endedAt)');
  expect(games).toContain('if(data.game_key==="speed"&&data.state?.deadlineAt)');

});


test("AI quiz entry stays visibly deferred until the manual question bank is supplied", async () => {
  const html = read("index.html");
  const tile = html.slice(html.indexOf('data-ai-quiz') - 80, html.indexOf('data-ai-quiz') + 500);
  expect(tile).toContain('disabled');
  expect(tile).toContain('aria-disabled="true"');
  expect(tile).toContain('قريباً');
  expect(tile).toContain('بنك الأسئلة اليدوي');
});


test("Morocco is not exposed as a standalone quiz category", async () => {
  const games = read("js/games.js");
  const expansion = read("js/knowledge-bank-expansion.js");
  expect(games).toContain('categories:["ثقافة عامة","علوم","تاريخ","جغرافيا","سينما","ألغاز"]');
  expect(games).not.toContain('cat==="المغرب"');
  const mixed = games.slice(games.indexOf("mixed:["), games.indexOf("predict:"));
  expect(mixed).not.toContain('["المغرب"');
  const expansionMixed = expansion.slice(expansion.indexOf("mixed:["), expansion.indexOf("speed:["));
  expect(expansionMixed).not.toContain('["المغرب"');
});


test("daily love letters use Morocco's local date and serialize simultaneous opens", async () => {
  const migration = read("supabase/migrations/202611180001_daily_love_letters_casablanca_day.sql");
  expect(migration).toContain("clock_timestamp() at time zone 'Africa/Casablanca'");
  expect(migration).toContain("opened_at at time zone 'Africa/Casablanca'");
  expect(migration).toContain("pg_advisory_xact_lock(20261118, 1)");
  expect(migration).toContain("where id=p_letter_id and opened_at is null");
  expect(migration).not.toContain("current_date");
  expect(migration).not.toMatch(/create\s+table|alter\s+table|drop\s+table/i);
  expect(migration).toContain("role in ('farhati','farahati')");
});


test("home next-event dashboard uses Casablanca civil-day boundaries and formatting", async () => {
  const dashboard = read("js/home-dashboard.js");
  expect(dashboard).toContain('const TIME_ZONE="Africa/Casablanca"');
  expect(dashboard).toContain('timeZone:TIME_ZONE,timeZoneName:"longOffset"');
  expect(dashboard).toContain(String.raw`const match=/GMT([+-])(\d{2}):(\d{2})/.exec(zone)`);
  expect(dashboard).toContain("function dayStartIso(value)");
  expect(dashboard).toContain(".gte(\"starts_at\",todayStart)");
  expect(dashboard).toContain('timeZone:TIME_ZONE,weekday:"long",day:"numeric",month:"long"');
  expect(dashboard).not.toContain("now.getFullYear()");
  expect(dashboard).not.toContain("now.getMonth()");
  expect(dashboard).not.toContain("now.getDate()");
});


test("game chat dialog exposes accessible non-modal semantics and keyboard dismissal", async () => {
  const games = read("js/games.js");
  expect(games).toContain('id="game-chat-panel" role="dialog" aria-labelledby="game-chat-title"');
  expect(games).not.toContain('id="game-chat-panel" role="dialog" aria-modal="true"');
  expect(games).toContain('id="game-chat-toggle" aria-haspopup="dialog" aria-controls="game-chat-panel"');
  expect(games).toContain('id="game-chat-title">حديثنا أثناء اللعب</b>');
  expect(games).toContain('event.key==="Escape"');
  expect(games).toContain('$("#game-chat-input")?.focus()');
  expect(games).toContain('$("#game-chat-toggle")?.focus()');
});


test("private messages expose connection and send feedback through polite live regions", async () => {
  const messages = read("js/messages.js");
  expect(messages).toContain('id="realtime-status" class="notice" role="status" aria-live="polite" aria-atomic="true"');
  expect(messages).toContain('id="msg-status" class="notice" role="status" aria-live="polite" aria-atomic="true"');
  expect(messages).toContain('for="msg-body"');
});


test("large quiz banks load only when a bank-backed game is opened", async () => {
  const html = read("index.html");
  const games = read("js/games.js");
  const worker = read("service-worker.js");
  expect(html).not.toContain('src="js/ayfar-question-bank.js');
  expect(html).not.toContain('src="js/ayfar-question-bank-expansion.js');
  expect(worker).not.toContain('"./js/ayfar-question-bank.js"');
  expect(worker).not.toContain('"./js/ayfar-question-bank-expansion.js"');
  expect(games).toContain('const BANK_GAME_KEYS=new Set(["mixed","speed","riddles","geography"])');
  expect(games).toContain('await loadQuestionScript("js/ayfar-question-bank.js?v=2")');
  expect(games).toContain('await loadQuestionScript("js/ayfar-question-bank-expansion.js?v=2")');
  expect(games).toContain('if(BANK_GAME_KEYS.has(key))await ensureQuestionBank()');
});

test("saved bank-backed matches load their questions before rendering or resuming", async () => {
  const games = read("js/games.js");
  expect(games).toContain('if(BANK_GAME_KEYS.has(data.game_key))await ensureQuestionBank();');
  expect(games).toContain('if(BANK_GAME_KEYS.has(game.game_key))await ensureQuestionBank();');
  expect(games).toContain('if(!data){localStorage.removeItem(ROOM_KEY);return}if(BANK_GAME_KEYS.has(data.game_key))await ensureQuestionBank();room=data;');
  expect(games).toContain('quizBanks.riddles=sourceBank.filter');
  expect(games).toContain('quizBanks.geography=sourceBank.filter');
});


test("notifications show readable details and support background system delivery", async () => {
  const notifications = read("js/notifications.js");
  const app = read("js/app.js");
  const worker = read("service-worker.js");
  expect(notifications).toContain('payload.new.body?" — "+payload.new.body:""');
  expect(notifications).toContain("Notification.requestPermission()");
  expect(notifications).toContain("registration.showNotification(item.title");
  expect(notifications).toContain('document.visibilityState==="hidden"');
  expect(worker).toContain('self.addEventListener("push"');
  expect(worker).toContain("silent:false");
  expect(worker).toContain('silent:false');
  expect(worker).toContain('self.registration.showNotification(title,options)');
  expect(worker).toContain('self.addEventListener("notificationclick"');
  expect(worker).toContain('type:"AYFAR_OPEN_NOTIFICATION"');
});


test("Web Push client state is initialized before subscription preparation", async () => {
  const notifications = read("js/notifications.js");
  expect(notifications).toContain('let pushPublicKey="",pushRegistration=null,pushSubscription=null,pushPreparation=null;');
  expect(notifications.indexOf('let pushPublicKey=""')).toBeLessThan(notifications.indexOf("async function preparePushSubscription()"));
});

test("Web Push subscriptions are private per user and notification delivery is signed", async () => {
  const migration = read("supabase/migrations/20261119040000_secure_web_push_delivery.sql");
  const push = read("supabase/functions/ayfar-push/index.ts");
  const notifications = read("js/notifications.js");
  const app = read("js/app.js");
  const worker = read("service-worker.js");
  expect(migration).toContain("create extension if not exists pg_net with schema extensions");
  expect(migration).toContain("create table if not exists public.ayfar_push_subscriptions");
  expect(migration).toContain("alter table public.ayfar_push_subscriptions enable row level security");
  expect(migration).toContain("using (user_id = (select auth.uid()))");
  expect(migration).toContain("with check (user_id = (select auth.uid()))");
  expect(migration).toContain("vault.create_secret");
  expect(migration).toContain("extensions.hmac(");
  expect(migration).toContain("net.http_post(");
  expect(migration).toContain("after insert on public.ayfar_notifications");
  expect(migration).toContain("after insert on public.private_messages");
  expect(migration).toContain("after insert on public.love_letters");
  expect(migration).toContain("وصلتك رسالة خاصة. افتح عالمكما لقراءتها.");
  expect(migration).toContain("هناك رسالة جديدة داخل المغلف. افتح عالمكما لقراءتها.");
  const privateMessageTrigger = migration.slice(migration.indexOf("create or replace function public.ayfar_notify_private_message"), migration.indexOf("revoke all on function public.ayfar_notify_private_message"));
  const loveLetterTrigger = migration.slice(migration.indexOf("create or replace function public.ayfar_notify_love_letter"), migration.indexOf("revoke all on function public.ayfar_notify_love_letter"));
  expect(privateMessageTrigger).not.toContain("new.body");
  expect(privateMessageTrigger).not.toContain("new.subject");
  expect(loveLetterTrigger).not.toContain("new.body");


  expect(migration).toContain("revoke all on function public.ayfar_push_get_config() from public, anon, authenticated");
  expect(push).toContain('npm:web-push@3.6.7');
  expect(push).toContain("webpush.generateVAPIDKeys()");
  expect(push).toContain("crypto.subtle.importKey");
  expect(push).toContain("constantTimeEqual");
  expect(push).toContain("admin.auth.getUser(token)");
  expect(push).toContain('statusCode === 404 || statusCode === 410');
  expect(notifications).toContain('db().functions.invoke("ayfar-push"');
  expect(notifications).toContain('pushRegistration.pushManager.subscribe');
  expect(notifications).toContain("preparePushSubscription().then(syncDeviceNotificationButton)");
  expect(notifications).toContain("if(!pushRegistration||!pushPublicKey)");
  expect(notifications).toContain('from("ayfar_push_subscriptions").upsert');
  expect(notifications).toContain('from("ayfar_push_subscriptions").delete()');
  expect(notifications).toContain("async function disableForLogout()");
  expect(app).toContain("await window.AYFAR_Notifications?.disableForLogout?.()");
  expect(notifications).toContain("isIOSHomeScreenApp()");
  expect(notifications).toContain('timeZone:"Africa/Casablanca"');
  expect(notifications).toContain('private_message:"#messages"');
  expect(notifications).toContain('love_letter:"#home-messages"');
  expect(notifications).toContain('window.AYFAR_on_enter?.(window.WorldStore?.get?.().active)');
  expect(notifications).toContain("await registration.pushManager.getSubscription())return");
  expect(worker).toContain('self.addEventListener("push"');
  expect(worker).toContain('target.searchParams.set("ayfar_notification",data.id)');
  expect(worker).toContain('new URL(data.url||"./index.html",self.registration.scope)');
});


test("Web Push lifecycle is wired from service-worker registration through authenticated login", () => {
  const app = read("js/app.js");
  const notifications = read("js/notifications.js");
  const html = read("index.html");
  expect(app).toContain('navigator.serviceWorker.register("./service-worker.js")');
  expect(app).toContain("window.AYFAR_Notifications.init(p)");
  expect(html).toContain('src="js/notifications.js?v=2"');
  expect(notifications).toContain('pushRegistration=await navigator.serviceWorker.ready');
  expect(notifications).toContain('db().functions.invoke("ayfar-push",{body:{action:"public-key"}})');
  expect(notifications).toContain('pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeVapidKey(pushPublicKey)})');
});


test("P0.1 challenge bootstrap is server-canonical and rejects invalid player pairing", async () => {
  const migration = read("supabase/migrations/202611200001_strict_game_challenge_bootstrap.sql");
  expect(migration).toContain("set search_path = ''");
  expect(migration).toContain("v_target_count <> 1");
  expect(migration).toContain("create or replace function public.ayfar_game_create(");
  expect(migration).toContain("create or replace function public.ayfar_game_join(p_game_id uuid)");
  expect(migration).toContain("يجب أن ينضم حساب الطرف الآخر، لا حساب بنفس الدور");
  expect(migration).toContain("يجب أن يكون التحدي بين أيوب وفرحتي فقط");
  expect(migration).toContain("يجب أن يكون التحدي بين أيوب وفرحتي فقط");
  expect(migration).toContain("'scores', jsonb_build_object('ayoub', 0, 'farahati', 0)");
  expect(migration).toContain("'phase', 'ready'");
  expect(migration).toContain("'answers', '{}'::jsonb");
  expect(migration).toContain("Rebuild the initial state rather than trusting the stored challenge JSON");
  expect(migration).toContain("revoke all on function public.ayfar_challenge_send(text, jsonb) from public, anon");
  expect(migration).toContain("grant execute on function public.ayfar_challenge_accept(uuid) to authenticated");
  expect(migration).not.toContain("min(p.id)");
  expect((migration.match(/as \$\$/g)||[]).length).toBe(4);
  expect((migration.match(/\$\$;/g)||[]).length).toBe(4);
  expect(migration).not.toMatch(/as \$\\ndeclare/);

});


test("early match stop is a server-authoritative action and never submits client-authored state", async () => {
  const games = read("js/games.js");
  const migration = read("supabase/migrations/202611200002_authoritative_game_stop.sql");
  const stop = games.slice(games.indexOf("async function stopSavedGame"), games.indexOf("async function restore"));
  expect(stop).toContain('rpc("ayfar_game_stop"');
  expect(stop).not.toContain('rpc("ayfar_game_update"');
  expect(stop).not.toContain("p_state:");
  expect(migration).toContain("create or replace function public.ayfar_game_stop(");
  expect(migration).toContain("auth.uid()");
  expect(migration).toContain("for update");
  expect(migration).toContain("v_game.version <> p_expected_version");
  expect(migration).toContain("v_user not in (v_game.host_id, v_game.guest_id)");
  expect(migration).toContain("'stoppedBy', v_role");
  expect(migration).toContain("'stoppedAt', clock_timestamp()");
  expect(migration).toContain("status = 'cancelled'");
  expect(migration).toContain("revoke all on function public.ayfar_game_stop(uuid, bigint) from public, anon");
  expect(migration).toContain("grant execute on function public.ayfar_game_stop(uuid, bigint) to authenticated");
});


test("challenge creation and acceptance rebuild a server-owned clean initial state", async () => {
  const migration = read("supabase/migrations/202611200003_server_owned_challenge_state.sql");
  expect(migration).toContain("public.ayfar_game_initial_state(p_game_key,p_state)");
  expect(migration).toContain("'phase', 'ready'");
  expect(migration).toContain("'scores', jsonb_build_object('ayoub',0,'farahati',0)");
  expect(migration).toContain("'answers', jsonb_build_object()");
  expect(migration).toContain("public.ayfar_game_initial_state(v_challenge.game_key,v_challenge.state)");
  expect(migration).toContain("revoke all on function public.ayfar_game_initial_state(text,jsonb) from public, anon, authenticated");
  expect(migration).toContain("grant execute on function public.ayfar_challenge_send(text,jsonb) to authenticated");
  expect(migration).toContain("grant execute on function public.ayfar_challenge_accept(uuid) to authenticated");
  expect(migration).not.toMatch(/drop\\s+table|truncate\\s+table|delete\\s+from\\s+public\\.ayfar_games/i);
});

test("the final visual layer consistently applies the existing shadow-free design system", async () => {
  const html = read("index.html");
  const polish = html.indexOf('css/individual-element-layout.css?v=1');
  const noShadows = html.indexOf('css/no-shadows.css?v=1');
  expect(polish).toBeGreaterThan(-1);
  expect(noShadows).toBeGreaterThan(polish);
  const stylesheet = read("css/no-shadows.css");
  expect(stylesheet).toContain("box-shadow: none !important");
  expect(stylesheet).toContain("text-shadow: none !important");
});

test("public question-bank scripts never ship correct-answer keys", async () => {
  const bank = read("js/ayfar-question-bank.js");
  const expansion = read("js/ayfar-question-bank-expansion.js");
  const knowledge = read("js/knowledge-bank.js");
  const knowledgeExpansion = read("js/knowledge-bank-expansion.js");
  const games = read("js/games.js");
  expect(bank).not.toContain("correctAnswer");
  expect(expansion).not.toContain("correctAnswer");
  const rowsMatch = expansion.match(/const rows=(\[[\s\S]*?\]);\nconst start=801;/);
  expect(rowsMatch).not.toBeNull();
  const rows = JSON.parse(rowsMatch[1]);
  expect(rows.every(row => row.length === 4)).toBe(true);
  expect(expansion).toContain("explanation:r[3]");
  expect(knowledge).not.toContain("answer:");
  expect(knowledge).not.toContain('"answer":');
  expect(knowledgeExpansion).not.toContain("answer:");
  expect(knowledgeExpansion).not.toContain('"answer":');
  expect(games).not.toContain('speed:[["');
  expect(games).not.toContain('mixed:[["');
  expect(games).not.toContain('riddles:[["');
});

test("bank-backed games use private server scoring and protect authoritative state", async () => {
  const games = read("js/games.js");
  const bankMigration = read("supabase/migrations/202611200004_authoritative_bank_scoring.sql");
  const flagsMigration = read("supabase/migrations/202611200005_secure_flags_bank.sql");
  const timeoutMigration = read("supabase/migrations/202611200006_idempotent_speed_timeout.sql");
  const nextMigration = read("supabase/migrations/202611200009_require_scored_round_before_next.sql");
  const deadlineMigration = read("supabase/migrations/202611200011_repair_legacy_speed_deadline.sql");
  expect(games).toContain('bankAction("ayfar_game_bank_answer"');
  expect(games).toContain('bankAction("ayfar_game_bank_next"');
  expect(games).toContain('bankAction("ayfar_game_bank_timeout"');
  expect(bankMigration).toContain("ayfar_private.game_question_bank");
  expect(bankMigration).toContain("correct_answer");
  expect(bankMigration).toContain("v_next:=(coalesce(p_state,'{}'::jsonb)");
  expect(flagsMigration).toContain("'flags'");
  expect(timeoutMigration).toContain("scoredRound");
  expect(timeoutMigration).toContain("return v_game");
  expect(nextMigration).toContain("لم تُحتسب نتيجة الجولة على الخادم بعد");
  expect(deadlineMigration).toContain("deadlineAt");
  expect(games).not.toContain("item?.options?.[item.correctAnswer]");
});

test("flags use the same private server-side scoring path", async () => {
  const games = read("js/games.js");
  const knowledge = read("js/knowledge-bank.js");
  const flagsMigration = read("supabase/migrations/202611200005_secure_flags_bank.sql");
  expect(games).toContain('const SERVER_BANK_GAME_KEYS=new Set([...BANK_GAME_KEYS,"flags"])');
  expect(games).toContain('bankAction("ayfar_game_bank_answer",{p_answer:b.dataset.knowledgeAnswer})');
  expect(games).toContain('bankResultMarkup(s,"العلم التالي")');
  expect(flagsMigration).toContain("'flags'");
  expect(flagsMigration).toContain("ayfar_game_bank_answer");
});

test("bank-game timer is cleared on rerender and speed timeout is server-owned", async () => {
  const games = read("js/games.js");
  expect(games).toContain('function render(){if(clock){clearInterval(clock);clock=null;}if(!room)return;');
  expect(games).toContain('bankAction("ayfar_game_bank_timeout")');
  expect(games).toContain('if(name==="ayfar_game_bank_next")speedExpiryPending=false');
});

test("legacy game creation sanitizes client-supplied result fields", async () => {
  const migration = read("supabase/migrations/202611200007_sanitize_legacy_game_create.sql");
  expect(migration).toContain("public.ayfar_game_initial_state(p_game_key,p_state)");
  expect(migration).toContain("'scores',jsonb_build_object('ayoub',0,'farahati',0)");
  expect(migration).toContain("'bankResult',null");
});

test("mobile home visual corrections restore heading contrast and spacing", async () => {
  const html = read("index.html");
  const noShadows = html.indexOf('css/no-shadows.css?v=1');
  const fixes = html.indexOf('css/ux-visual-fixes.css?v=1');
  expect(fixes).toBeGreaterThan(noShadows);
  const css = read("css/ux-visual-fixes.css");
  expect(css).toContain("color:#69243e!important");
  expect(css).toContain("max-width:100%!important");
  expect(css).toContain("unicode-bidi:plaintext");
  expect(css).toContain("scroll-margin-top:96px");
  expect(css).toContain("padding-bottom:104px");
});

test("non-bank couple games submit answers and calculate scores only on the server", async () => {
  const games = read("js/games.js");
  const migration = read("supabase/migrations/202611200010_authoritative_couple_game_actions.sql");
  expect(games).toContain('gameAction("start")');
  expect(games).toContain('gameAction("who_submit",{answer,guess})');
  expect(games).toContain('gameAction("who_judge"');
  expect(games).toContain('gameAction("predict_actual"');
  expect(games).toContain('gameAction("predict_guess"');
  expect(games).toContain('gameAction("truth_choice"');
  expect(games).toContain('gameAction("truth_skip")');
  expect(games).toContain('gameAction("answer",{answer:v})');
  expect(games).toContain('gameAction("next")');
  expect(games).not.toContain("scoreRound(");
  expect(games).toContain("gameActionAlreadyApplied");
  expect(migration).toContain("public.ayfar_game_action");
  expect(migration).toContain("public.ayfar_game_choice_valid");
  expect(migration).toContain("public.ayfar_game_normalize_text");
  expect(migration).toContain("v_chat:=jsonb_build_object");
  expect(migration).toContain("v_state:=v_state-array['answers'");
});
