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
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
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
  expect(results).toHaveProperty("violations");
});
