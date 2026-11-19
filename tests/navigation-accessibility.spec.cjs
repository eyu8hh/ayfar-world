const { test, expect } = require("@playwright/test");

async function stubExternalServices(page) {
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//, route => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.supabase={createClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:null},error:null}),getUser:async()=>({data:{user:null},error:null})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})})};`
    })
  );
}

test("skip link becomes visible on keyboard focus and moves focus to main content", async ({ page }) => {
  await stubExternalServices(page);
  await page.goto("/");
  const skipLink = page.locator(".skip-link");
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  const linkBox = await skipLink.boundingBox();
  expect(linkBox).not.toBeNull();
  expect(linkBox.height).toBeGreaterThan(0);
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("home section navigation exposes one current page and follows selected sections", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubExternalServices(page);
  await page.goto("/");
  await page.locator("#login").evaluate(element => element.classList.add("hidden"));
  await page.locator("#home").evaluate(element => element.classList.remove("hidden"));

  const navigation = page.getByRole("navigation", { name: "أقسام عالمنا" });
  const buttons = navigation.getByRole("button");
  await expect(buttons).toHaveCount(5);
  await expect(buttons.first()).toHaveAttribute("aria-current", "page");

  const messages = navigation.getByRole("button", { name: "رسائلنا" });
  await messages.click();
  await expect(messages).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#home-slide-label")).toHaveText("رسائلنا");
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator("#home-messages")).toBeInViewport();

  const more = navigation.getByRole("button", { name: "المزيد" });
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  const moreMenu = page.getByRole("group", { name: "أقسام إضافية" });
  await expect(moreMenu.getByRole("button")).toHaveCount(3);
  const plans = moreMenu.getByRole("button", { name: "خططنا وأنشطتنا" });
  await plans.click();
  await expect(page.locator('.home-more-menu [data-home-target="home-plans"]')).toHaveAttribute("aria-current", "page");
  await expect(more).toHaveClass(/active/);
  await expect(moreMenu).toBeHidden();
  await expect(page.locator("#home-slide-label")).toHaveText("خططنا وأنشطتنا");

});

test("reduced-motion preference disables smooth document scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await stubExternalServices(page);
  await page.goto("/");
  await expect.poll(() => page.locator("html").evaluate(element => getComputedStyle(element).scrollBehavior)).toBe("auto");
});
