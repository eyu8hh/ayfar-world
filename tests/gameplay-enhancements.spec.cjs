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
});

test("game chat reactions are stored in the shared match state", async () => {
  const games = read("js/games.js");
  expect(games).toContain("data-chat-react");
  expect(games).toContain("message.reactions[emoji]");
  expect(games).toContain("actors.filter(actor=>actor!==role)");
});

test("match creation no longer blocks an additional active room", async () => {
  const games = read("js/games.js");
  const migration = read("supabase/migrations/202611070001_allow_multiple_active_games.sql");
  expect(games).toContain("Detach this tab");
  expect(migration).toContain("ayfar_challenge_send");
  expect(migration).toContain("ayfar_challenge_accept");
  expect(migration).not.toContain("لديكما مباراة نشطة بالفعل");
  expect(migration).not.toContain("لديك مباراة نشطة بالفعل");
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
