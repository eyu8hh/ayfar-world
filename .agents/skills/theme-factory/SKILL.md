# Theme Factory — AYFAR project adaptation

Source inspiration: Anthropic `skills/theme-factory` (Apache-2.0). This adaptation selects the existing AYFAR visual identity rather than applying unrelated preset palettes.

## AYFAR theme
Use the committed tokens in `css/app.css` and `css/design-polish.css` as the source of truth. The palette is burgundy, rose/pink, and green with warm ivory surfaces.

- Primary ink: deep burgundy.
- Accent: muted rose/pink.
- Secondary accent: natural green.
- Surfaces: warm white/ivory with restrained rose and green tints.
- Borders: soft warm neutral, readable around controls.
- Motion: short ease-out transitions; reduced motion must remain functional.

## Rules
1. Do not replace AYFAR's palette with a preset such as neon, cyberpunk, or generic SaaS blue.
2. Keep text/background contrast readable in Arabic at 360–390px.
3. Define theme changes as CSS custom properties; do not duplicate palette literals across components.
4. Use semantic roles (ink, muted, primary, accent, success, surface, border) rather than names tied to a single screen.
5. Never change original brand images or logos to fit a theme.
6. Test login, home sections, games, message envelope, and shared-star surfaces after any token change.
