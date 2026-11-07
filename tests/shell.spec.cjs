const { test, expect } = require("@playwright/test");

async function stubExternalServices(page) {
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//, route => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.supabase = {
        createClient: () => ({
          auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: { user: null }, error: { message: "QA stub" } }),
            signOut: async () => ({ error: null }),
            updateUser: async () => ({ data: { user: null }, error: null })
          },
          from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
            upsert: async () => ({ error: null })
          })
        })
      };`
    })
  );
}

test("Arabic RTL login shell renders at a mobile viewport", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await stubExternalServices(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/AYFAR WORLD/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#auth-form")).toBeVisible();
  await expect(page.locator("#auth-email")).toHaveAttribute("type", "email");
  await expect(page.locator("#auth-password")).toHaveAttribute("type", "password");
  expect(pageErrors).toEqual([]);
});

test("all seven home sections remain in the document", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  await expect(page.locator(".home-section-nav [data-home-target]")).toHaveCount(7);
  await expect(page.locator("#home-pages > .home-section-anchor")).toHaveCount(7);
  for (const id of [
    "home-overview", "home-our-world", "home-messages",
    "home-games", "home-plans", "home-routine", "home-pets"
  ]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("login screen does not overflow horizontally at 390px", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
