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
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
              order: async () => ({ data: [], error: null })
            }),
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
  await expect(page.locator(".home-section-nav [data-home-target]")).toHaveCount(5);
  await expect(page.locator(".home-more-menu [data-home-target]")).toHaveCount(0);
  await expect(page.locator("#home-pages > .home-section-anchor")).toHaveCount(8);
  for (const id of [
    "home-overview", "home-our-world", "home-messages",
    "home-games", "home-plans", "home-routine", "home-pets"
  ]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("plan actions are native buttons and retain their action hooks", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  const cards = page.locator("#home-plans .plan-card-action");
  await expect(cards).toHaveCount(6);
  await expect(cards.first()).toHaveAttribute("type", "button");
  await expect(cards.nth(1)).toHaveAttribute("data-open-calendar", "");
  await expect(cards.nth(2)).toHaveAttribute("data-plan-open", "daily");
});

test("home hero uses the full width after removing its decorative heart", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  const paddingLeft = await page.locator("#home-overview .hero").evaluate(element => getComputedStyle(element).paddingLeft);
  expect(parseFloat(paddingLeft)).toBeLessThanOrEqual(30);
  const gameCardTransform = await page.locator("#home-games .games>button").first().evaluate(element => getComputedStyle(element).transform);
  expect(gameCardTransform).toBe("none");
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

test("static navigation uses native controls with explicit button types", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  await expect(page.locator("button:not([type])")).toHaveCount(0);
  await expect(page.locator('[role="button"]')).toHaveCount(0);
  await expect(page.locator(".home-slide-controls")).toHaveJSProperty("tagName", "NAV");
});

test("home navigation uses smooth native horizontal touch scrolling and readable controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubExternalServices(page);
  await page.goto("/");
  await page.locator("#login").evaluate(element => element.classList.add("hidden"));
  await page.locator("#home").evaluate(element => element.classList.remove("hidden"));
  const pager = page.locator("#home-pages");
  const touchAction = await pager.evaluate(element => getComputedStyle(element).touchAction);
  expect(["pan-x pan-y pinch-zoom", "manipulation"]).toContain(touchAction);
  await expect(pager).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(pager).toHaveCSS("direction", "rtl");
  await expect(page.locator("#home-slide-label")).toHaveCSS("position", "absolute");
  const controls = page.locator(".home-slide-controls button");
  await expect(controls).toHaveCount(2);
  for (const control of await controls.all()) {
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(control.locator("i")).toHaveAttribute("aria-hidden", "true");
  }
  await expect(page.locator("#home-slide-label")).not.toContainText(/[0-9]/);
  await expect(page.locator(".home-section-nav button")).toHaveCount(5);
});


test("home dashboard includes a live next-event card and notification bell", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  await page.locator("#login").evaluate(element => element.classList.add("hidden"));
  await page.locator("#home").evaluate(element => element.classList.remove("hidden"));
  await expect(page.locator("#home-next-event")).toHaveCount(1);
  await expect(page.locator("#home-next-event-title")).toHaveText("موعدنا القادم");
  await expect(page.locator("#notification-bell")).toHaveCount(1);
  await expect(page.locator("#notification-bell .lucide-bell")).toHaveCount(1);
  await expect(page.locator(".home-next-event-action")).toHaveAttribute("type", "button");
  const actionBox = await page.locator(".home-next-event-action").boundingBox();
  expect(actionBox.height).toBeGreaterThanOrEqual(44);
});


test("static page headings do not rely on decorative English overlines", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  await expect(page.locator("small.eyebrow")).toHaveCount(0);
  await expect(page.locator("#hello")).toHaveText("مرحباً بك في عالمنا");
  await expect(page.locator(".home-anniversary h3")).toHaveText("منذ أول حديث بيننا");
  await expect(page.locator("#home-games h3")).toHaveText("ألعابنا");
});


test("shared planning dialogs trap keyboard focus and restore their opener", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  await page.locator("#login").evaluate(element => element.classList.add("hidden"));
  await page.locator("#home").evaluate(element => element.classList.remove("hidden"));

  const dreamsTrigger = page.locator("[data-open-dreams]").first();
  await dreamsTrigger.click();
  const dreamsDialog = page.locator("#dreams-dialog [role='dialog']");
  const dreamsClose = page.locator("[data-dream-close]");
  await expect(dreamsDialog).toBeVisible();
  await expect(page.locator("#dream-title-input")).toBeFocused();
  await dreamsClose.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#dream-save")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dreamsClose).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dreamsDialog).toBeHidden();
  await expect(dreamsTrigger).toBeFocused();

  const calendarTrigger = page.locator("[data-open-calendar]").first();
  await calendarTrigger.click();
  const calendarDialog = page.locator("#calendar-dialog [role='dialog']");
  const calendarClose = page.locator("[data-calendar-close]");
  await expect(calendarDialog).toBeVisible();
  await expect(calendarClose).toBeFocused();
  await page.locator("#calendar-save").focus();
  await page.keyboard.press("Tab");
  await expect(calendarClose).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#calendar-save")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(calendarDialog).toBeHidden();
  await expect(calendarTrigger).toBeFocused();
});
