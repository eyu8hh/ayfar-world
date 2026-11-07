import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const root = process.cwd();
const baselineRoot = resolve(root, "baseline");
const outputDir = resolve(root, "artifacts/design-review");
const servers = [];

async function startServer(cwd, port) {
  const child = spawn(process.execPath, ["tools/serve.mjs"], {
    cwd,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "inherit"],
  });
  servers.push(child);
  const url = `http://127.0.0.1:${port}/`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return url;
    } catch {}
    await delay(200);
  }
  throw new Error(`AYFAR preview server did not start on port ${port}`);
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
      path: resolve(outputDir, `${label}-login-390x844.png`),
      animations: "disabled",
    });

    // Visual-only shell preview: reveal static home markup without signing in,
    // touching storage, or making authenticated Supabase requests.
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
    if (metrics.viewportWidth !== 390 || metrics.documentWidth > 390) {
      throw new Error(`${label}: viewport or horizontal overflow check failed: ${JSON.stringify(metrics)}`);
    }
    if (metrics.pagesOverflowX !== "auto" || metrics.sectionOverflowY !== "auto") {
      throw new Error(`${label}: section navigation/scroll behavior changed: ${JSON.stringify(metrics)}`);
    }
    await page.screenshot({
      path: resolve(outputDir, `${label}-home-390x844.png`),
      animations: "disabled",
    });
    return metrics;
  } finally {
    await context.close();
  }
}

try {
  if (!existsSync(resolve(baselineRoot, "tools/serve.mjs"))) {
    throw new Error("The main-branch baseline checkout is missing.");
  }
  await mkdir(outputDir, { recursive: true });
  const beforeUrl = await startServer(baselineRoot, 4174);
  const afterUrl = await startServer(root, 4173);
  const browser = await chromium.launch({ headless: true });
  try {
    const before = await capture(browser, beforeUrl, "before");
    const after = await capture(browser, afterUrl, "after");
    process.stdout.write(`390×844 Playwright screenshots saved.\nBefore: ${JSON.stringify(before)}\nAfter: ${JSON.stringify(after)}\n`);
  } finally {
    await browser.close();
  }
} finally {
  for (const server of servers) server.kill("SIGTERM");
}
