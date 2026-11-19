const { test, expect } = require("@playwright/test");
const { AxeBuilder } = require("@axe-core/playwright");

test("axe-core scans the login experience and records WCAG findings", async ({ page }, testInfo) => {
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//, route => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.supabase={createClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})})};"
    })
  );
  await page.goto("/");
  const scan = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const loginResults = await scan();
  await testInfo.attach("ayfar-login.png", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  await page.locator("#login").evaluate(el => el.classList.add("hidden"));
  await page.locator("#home").evaluate(el => el.classList.remove("hidden"));
  const homeResults = await scan();
  await testInfo.attach("ayfar-home.png", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  const results = { passes: [...loginResults.passes, ...homeResults.passes], incomplete: [...loginResults.incomplete, ...homeResults.incomplete], violations: [...loginResults.violations, ...homeResults.violations] };
  await testInfo.attach("axe-login-results.json", {
    body: JSON.stringify({
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      violations: results.violations.map(({ id, impact, description, nodes }) => ({
        id, impact, description, nodes: nodes.map(node => ({
          target: node.target,
          summary: node.failureSummary
        }))
      }))
    }, null, 2),
    contentType: "application/json"
  });
  console.log(`axe-core: ${results.violations.length} violation(s), ${results.incomplete.length} incomplete check(s)`);
  expect(results.violations).toEqual([]);
});


test("axe-core covers authenticated private messages and the shared calendar dialog", async ({ page }, testInfo) => {
  await page.route(/^https:\/\/(fonts\\.googleapis\\.com|fonts\\.gstatic\\.com|cdn\\.jsdelivr\\.net)\\//, route => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.supabase={createClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})})};"
    })
  );
  await page.goto("/");
  await page.evaluate(() => {
    window.WorldStore.update(state => { state.active = "ayoub"; });
    window.ayfarSupabase = {
      auth: { getUser: async () => ({ data: { user: { id: "qa-ayoub" } }, error: null }) },
      from(table) {
        return {
          select() {
            return {
              in: async () => ({ data: [{ id: "qa-farahati", role: "farahati" }, { id: "qa-ayoub", role: "ayoub" }], error: null }),
              order: async () => ({ data: table === "private_messages" ? [{ id: "m1", sender_id: "qa-farahati", body: "مرحباً أيوب", created_at: "2026-11-19T10:00:00Z" }] : [], error: null })
            };
          }
        };
      },
      channel() { return { on() { return this; }, subscribe() { return this; } }; },
      removeChannel: async () => ({})
    };
    document.querySelector("#login").classList.add("hidden");
    document.querySelector("#home").classList.remove("hidden");
  });

  await page.locator("#messages").click();
  await expect(page.locator("#msg-form")).toBeVisible();
  await expect(page.locator("#msg-body")).toHaveAttribute("maxlength", "5000");
  const messageResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  await testInfo.attach("ayfar-authenticated-messages.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png"
  });
  expect(messageResults.violations).toEqual([]);

  await page.locator("#back").click();
  await page.locator("[data-open-calendar]").first().click();
  await expect(page.locator("#calendar-dialog [role='dialog']")).toBeVisible();
  await expect(page.locator("#calendar-event-title")).toBeVisible();
  const calendarResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  await testInfo.attach("ayfar-calendar-dialog.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png"
  });
  expect(calendarResults.violations).toEqual([]);
});
