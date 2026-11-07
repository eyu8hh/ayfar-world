# AYFAR WORLD — project-scoped design and QA skills

The project-specific skill set is tracked under `.agents/skills/`. It is separate from the PWA runtime: no skill file is loaded by the public website, and no React/GSAP runtime is added by installing these references.

## Skills available

- **Frontend Design** — AYFAR-adapted visual hierarchy, typography, purposeful layouts, and finishing quality.
- **Theme Factory** — AYFAR palette tokens; do not replace the burgundy/rose/green identity with unrelated presets.
- **Impeccable** — audit, critique, polish, responsive design, and accessibility workflow. Read its SKILL.md and references before a design pass.
- **Taste Skill** — visual craft adapted for Arabic RTL; preserve horizontal section navigation and vertical scrolling inside sections.
- **Extract Design** — extract design language from reference websites, then compare rather than blindly importing.
- **GSAP** — core, timelines, ScrollTrigger, and performance references. Do not add a runtime dependency without a concrete need.
- **Playwright CLI** — browser-agent command reference; use `npx playwright cli` after `npm install`.
- **React Bits** — React-only catalog, for interaction inspiration. AYFAR remains vanilla HTML/CSS/JS.
- **Transitions.dev** — transition and motion QA references; prefer CSS-first, short, interruptible motion.

## QA toolchain

```sh
npm install
npx playwright install chromium
npm run qa
```

GitHub Actions installs the pinned local QA tools, runs static checks and browser tests, then stores a mobile Lighthouse report as an artifact. This workflow does not deploy Supabase functions or change secrets.

## AYFAR non-negotiable constraints

1. Preserve every working feature, user record, Supabase policy, role, session, and synchronization path.
2. Arabic RTL and mobile-first are mandatory. Verify 390×844 and narrow 360px widths.
3. Section navigation stays horizontal; content inside each section remains vertically scrollable.
4. Preserve the burgundy, rose/pink, and green palette and all original files under `assets/brand/`.
5. Prefer existing vanilla CSS/JS. No React, Tailwind, Three.js, or GSAP dependency without an approved concrete need.
6. Keep motion short, interruptible, transform/opacity-first, and reduced under `prefers-reduced-motion`.
7. Never use real account credentials in browser tests. Mock the public Supabase SDK boundary for shell-only checks.
8. Never clear localStorage, IndexedDB, cookies, or service-worker state as a test shortcut.
9. Do not treat static/syntax checks as proof of two-device synchronization.
10. Never claim a skill command or browser test was run unless the corresponding tool actually ran.
