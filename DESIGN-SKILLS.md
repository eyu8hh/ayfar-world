# AYFAR WORLD — project-local design and browser skills

These skills are installed under `.agents/skills/` for this repository only. They do not change the PWA runtime or add frontend dependencies by themselves.

## Installed
- **Impeccable** — already present at `.agents/skills/impeccable/`; use for audit, critique, polish and responsive/accessibility checks.
- **Taste Skill** — `.agents/skills/design-taste-frontend/`. Use its craft guidance selectively; the AYFAR compatibility override preserves the existing Arabic RTL private-app identity and the intended vertical scroll inside each category.
- **Designlang / extract-design** — `.agents/skills/extract-design/`. Use to extract design tokens and language from an existing live website, then compare against AYFAR's committed design rather than blindly importing another site's palette.
- **React Bits** — `.agents/skills/react-bits/`, including the live component catalog and fetch script. It targets React; AYFAR is vanilla HTML/CSS/JS, so do not migrate frameworks or paste React components into the app. Use as a source of interaction ideas or for a separately approved React surface.
- **GSAP** — `.agents/skills/gsap-core/`, `gsap-timeline/`, `gsap-scrolltrigger/`, and `gsap-performance/`. GSAP is framework-agnostic; add the runtime library only when a concrete interaction justifies it, respecting reduced-motion and low-end Android performance.
- **Transitions.dev** — `.agents/skills/transitions-dev/` and `transitions-polish/`. Use CSS-first patterns for purposeful transitions; preserve native scroll gestures and avoid competing scroll listeners.
- **Playwright CLI** — `.agents/skills/playwright-cli/`. This is the agent guidance. The CLI executable itself still needs Node.js 18+ and `npm install -g @playwright/cli@latest`; then `playwright-cli install --skills=agents` can install the CLI's own skill layout. This repository commit does not perform a global install.

## AYFAR rules
1. Preserve all current features, Supabase data, role permissions and navigation.
2. Arabic RTL and mobile-first are mandatory; test narrow Android and iPhone widths.
3. Category navigation is horizontal; content inside every category must remain vertically scrollable.
4. Prefer existing vanilla CSS/JS. Do not add React, Tailwind, Three.js or GSAP packages without a concrete use case.
5. Keep animation light, interruptible, and reduced under `prefers-reduced-motion`.
6. Verify the real deployed page where possible: login, horizontal section navigation, vertical category scrolling, and core interactions on mobile viewports.
