const { test, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const { mkdirSync, existsSync } = require("node:fs");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

const root = process.cwd();
const baselineRoot = path.resolve(root, "baseline");
const outputDir = path.resolve(root, "artifacts/design-review");
const sections = [
  ["overview", "home-overview"],
  ["our-world", "home-our-world"],
  ["messages", "home-messages"],
  ["games", "home-games"],
  ["plans", "home-plans"],
  ["routine", "home-routine"],
  ["pets", "home-pets"],
];

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
  const metricsBySection = [];
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.locator("#login").waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.screenshot({
      path: path.join(outputDir, `${label}-login-390x844.png`),
      animations: "disabled",
    });

    // Reveal static home markup for comparison only; no account, storage,
    // authentication or Supabase data is used.
    await page.evaluate(() => {
      document.querySelector("#login")?.classList.add("hidden");
      document.querySelector("#home")?.classList.remove("hidden");
    });

    for (const [name, id] of sections) {
      await page.evaluate(targetId => {
        const pager = document.querySelector("#home-pages");
        const target = document.getElementById(targetId);
        if (!pager || !target) throw new Error(`Missing home section: ${targetId}`);
        pager.scrollTo({ left: target.offsetLeft, top: 0, behavior: "auto" });
        target.scrollTo({ top: 0, behavior: "auto" });
        document.querySelectorAll(".home-section-nav button").forEach(button => {
          button.classList.toggle("active", button.dataset.homeTarget === targetId);
        });
      }, id);
      await page.waitForTimeout(80);

      const metrics = await page.evaluate(targetId => {
        const pages = document.querySelector("#home-pages");
        const section = document.getElementById(targetId);
        return {
          section: targetId,
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          pagesOverflowX: pages ? getComputedStyle(pages).overflowX : "missing",
          sectionOverflowY: section ? getComputedStyle(section).overflowY : "missing",
          pagesScrollWidth: pages?.scrollWidth ?? 0,
          pagesClientWidth: pages?.clientWidth ?? 0,
        };
      }, id);
      metricsBySection.push(metrics);
      await page.screenshot({
        path: path.join(outputDir, `${label}-${name}-390x844.png`),
        animations: "disabled",
      });
    }
    return metricsBySection;
  } finally {
    await context.close();
  }
}

test("390x844 before/after captures all seven AYFAR sections and preserves navigation/scroll", async ({ browser }) => {
  test.skip(!existsSync(path.join(baselineRoot, "tools/serve.mjs")), "Main baseline checkout is available in CI only.");
  mkdirSync(outputDir, { recursive: true });
  const { server, url: beforeUrl } = await startBaselineServer();
  try {
    const before = await capture(browser, beforeUrl, "before");
    const after = await capture(browser, "http://127.0.0.1:4173/", "after");
    for (const metrics of after) {
      expect(metrics.viewportWidth, metrics.section).toBe(390);
      expect(metrics.documentWidth, metrics.section).toBeLessThanOrEqual(390);
      expect(metrics.pagesOverflowX, metrics.section).toBe("auto");
      expect(metrics.sectionOverflowY, metrics.section).toBe("auto");
      expect(metrics.pagesScrollWidth, metrics.section).toBeGreaterThan(metrics.pagesClientWidth);
    }
    console.log(`390x844 comparison captured for ${sections.length} sections. Before: ${JSON.stringify(before)}. After: ${JSON.stringify(after)}`);
  } finally {
    server.kill("SIGTERM");
  }
});
