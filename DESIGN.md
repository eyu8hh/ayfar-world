# AYFAR WORLD — Design system

## Visual direction
A quiet, intimate editorial identity: warm ivory surfaces, deep burgundy ink, restrained rose accents, and botanical green. Premium through typography, rhythm, contrast, and restraint—not decorative gradients or excessive glass effects.

## Language and layout
- Arabic-first with RTL as the default.
- English is reserved for short eyebrow labels, section metadata, and the AYFAR wordmark when it improves hierarchy.
- Keep all controls and reading flows clear in Arabic.
- Design mobile-first for 360–390px, then expand naturally.

## Semantic color roles
Use CSS custom properties as the source of truth:
- Primary ink / primary action: burgundy (#70243f).
- Accent: rose/pink (#e7a0b5), used for emphasis, never as low-contrast body text.
- Secondary accent / success: green (#47765c), with dark enough foreground text.
- Surfaces: warm ivory and near-white.
- Muted text: dark warm neutral; avoid pale grey for important copy.
- Borders: soft neutral, visible around controls.

## Accessibility requirements
- Normal text must meet WCAG AA contrast (4.5:1); large text at least 3:1.
- Never communicate status by color alone.
- Keep visible focus indicators and minimum 44px touch targets.
- Respect prefers-reduced-motion.
- Prefer native buttons, links, labels, and form controls.
- Test login, home, games, letters, shared stars, and plans after token changes.

## Motion
Short, purposeful transitions only. Motion should clarify state changes; no decorative continuous animation. Keep all functionality with reduced motion.
