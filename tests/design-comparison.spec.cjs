const { test, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const { mkdirSync, existsSync } = require("node:fs");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

const root = process.cwd();
const baselineRoot = path.resolve(root, "baseline");
const outputDir = path.resolve(root, "artifacts/design-review");

async function startBaselineServer() {
  const server = spawn(process.execPath, ["tools/serve.mjs"], {
    cwd: baselineRoot,
    env: { ...process.env, PORT: "4174" },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const url = "http://127.0.0.1:4174/";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return { server, url };
    } catch {}
    await delay(200);
  }
  server.kill("SIGTERM");
  throw new Error("The main-branch baseline server did not start.");
}

async function capture(browser, url, label) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.locator("#login").waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.screenshot({
      path: path.join(outputDir, `${label}-login-390x844.png`),
      animations: "disabled",
    });

    // Reveal only static home markup for a visual comparison; no account,
    // storage, authentication or Supabase data is used.
    await page.evaluate(() => {
      document.querySelector("#login")?.classList.add("hidden");
      document.querySelector("#home")?.classList.remove("hidden");
      document.querySelector("#home-pages")?.scrollTo({ left: 0, top: 0 });
      document.querySelector("#home-overview")?.scrollTo({ top: 0 });
    });
    await page.waitForTimeout(120);

    const metrics = await page.evaluate(() => {
      const pages = document.querySelector("#home-pages");
      const overview = document.querySelector("#home-overview");
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        pagesOverflowX: pages ? getComputedStyle(pages).overflowX : "missing",
        sectionOverflowY: overview ? getComputedStyle(overview).overflowY : "missing",
        pagesScrollWidth: pages?.scrollWidth ?? 0,
        pagesClientWidth: pages?.clientWidth ?? 0,
      };
    });
    await page.screenshot({
      path: path.join(outputDir, `${label}-home-390x844.png`),
      animations: "disabled",
    });
    return metrics;
  } finally {
    await context.close();
  }
}

test("390x844 before/after visual comparison preserves AYFAR navigation and scroll", async ({ browser }) => {
  test.skip(!existsSync(path.join(baselineRoot, "tools/serve.mjs")), "Main baseline checkout is available in CI only.");
  mkdirSync(outputDir, { recursive: true });
  const { server, url: beforeUrl } = await startBaselineServer();
  try {
    const before = await capture(browser, beforeUrl, "before");
    const after = await capture(browser, "http://127.0.0.1:4173/", "after");
    expect(after.viewportWidth).toBe(390);
    expect(after.documentWidth).toBeLessThanOrEqual(390);
    expect(after.pagesOverflowX).toBe("auto");
    expect(after.sectionOverflowY).toBe("auto");
    expect(after.pagesScrollWidth).toBeGreaterThan(after.pagesClientWidth);
    console.log(`390x844 screenshots captured. Before: ${JSON.stringify(before)}. After: ${JSON.stringify(after)}`);
  } finally {
    server.kill("SIGTERM");
  }
});
