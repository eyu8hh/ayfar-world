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


test("game chat dialog exposes modal semantics and traps keyboard focus", async () => {
  const games = read("js/games.js");
  expect(games).toContain('id="game-chat-panel" role="dialog" aria-modal="true" aria-labelledby="game-chat-title"');
  expect(games).toContain('id="game-chat-title">حديثنا أثناء اللعب</b>');
  expect(games).toContain('event.key==="Escape"');
  expect(games).toContain('event.key!=="Tab"');
  expect(games).toContain('event.shiftKey&&(document.activeElement===first||!chatPanel.contains(document.activeElement))');
  expect(games).toContain('!event.shiftKey&&(document.activeElement===last||!chatPanel.contains(document.activeElement))');
  expect(games).toContain('$("#game-chat-input")?.focus()');
  expect(games).toContain('$("#game-chat-toggle")?.focus()');
});
