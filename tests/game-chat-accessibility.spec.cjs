const { test, expect } = require("@playwright/test");

test("game chat opens with focus, stays non-modal, and restores focus on Escape", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.supabase={createClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})})};"
    })
  );
  await page.goto("/");

  await page.evaluate(async () => {
    window.WorldStore.update(state => { state.active = "ayoub"; });
    const game = {
      id: "qa-game-1",
      game_key: "who",
      status: "active",
      version: 1,
      updated_at: new Date().toISOString(),
      state: {
        phase: "play",
        round: 1,
        total: 5,
        scores: { ayoub: 0, farahati: 0 },
        answers: {},
        chatMessages: []
      }
    };
    const challenge = {
      id: "qa-challenge-1",
      from_user: "qa-ayoub",
      to_user: "qa-farahati",
      status: "accepted",
      game_id: game.id,
      game_key: game.game_key
    };
    window.ayfarSupabase = {
      auth: { getUser: async () => ({ data: { user: { id: "qa-ayoub" } }, error: null }) },
      from(table) {
        if (table === "ayfar_game_challenges") {
          const query = {
            select() { return this; },
            or() { return this; },
            order() { return this; },
            limit: async () => ({ data: [challenge], error: null })
          };
          return query;
        }
        if (table === "ayfar_games") {
          const query = {
            select() { return this; },
            eq() { return this; },
            maybeSingle: async () => ({ data: game, error: null })
          };
          return query;
        }
        throw new Error("Unexpected table: " + table);
      },
      channel() { return { on() { return this; }, subscribe() { return this; } }; },
      removeChannel: async () => ({})
    };
    localStorage.setItem("ayfar_pending_challenge_v1", challenge.id);
    document.querySelector("#login").classList.add("hidden");
    document.querySelector("#home").classList.remove("hidden");
    await window.AYFAR_Games.initChallenges("ayoub");
  });

  const toggle = page.locator("#game-chat-toggle");
  const panel = page.locator("#game-chat-panel");
  await expect(toggle).toBeVisible();
  await expect(panel).toHaveCount(0);

  await toggle.click();
  await expect(panel).toBeVisible();
  await expect(page.locator("#game-chat-input")).toBeFocused();
  await expect(panel).not.toHaveAttribute("aria-modal", "true");

  await page.locator("#game-chat-input").press("Tab");
  await expect(panel.locator("#game-chat-form button[type='submit']")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();

  await page.locator("#game-chat-input").focus();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(toggle).toBeFocused();

  await toggle.click();
  await expect(page.locator("#game-chat-input")).toBeFocused();
  await page.locator("#game-chat-close").click();
  await expect(panel).toHaveCount(0);
  await expect(toggle).toBeFocused();
});
