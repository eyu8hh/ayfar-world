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
