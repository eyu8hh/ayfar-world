# Frontend Design — AYFAR project adaptation

Source inspiration: Anthropic `skills/frontend-design` (Apache-2.0). This is a concise project adaptation, not a byte-for-byte copy of the upstream document.

## Objective
Create distinctive, deliberate interfaces rather than generic templates. Every visual decision must support clarity, intimacy, trust, and usability in AYFAR WORLD.

## Design rules
- Start from the real product context and current screens. Do not rebuild the application or invent features to make a design look impressive.
- Preserve Arabic-first RTL layout, the existing burgundy/rose/green identity, and the AYFAR brand assets.
- Create hierarchy through spacing, typography, grouping, and contrast. Avoid excessive cards, gradients, blur, ornamental icons, and decorative motion.
- Keep Arabic typography legible at mobile sizes; use an intentional type scale and comfortable line-height.
- Make controls obvious, keyboard reachable, and at least 44px high where practical.
- Provide clear focus-visible, disabled, loading, success, and error states.
- Respect safe areas, narrow screens, dynamic viewport height, and vertical scrolling inside each section.
- Use motion to explain state changes. Prefer transform and opacity, keep durations short, and honor prefers-reduced-motion.
- Preserve all behavior and data contracts. Visual changes must not alter auth, roles, Supabase, synchronization, message sequencing, shared stars, or 7pm date logic.
- Critique the result at 360px and 390px widths; verify that no content is clipped or horizontally overflows.

## Completion standard
A change is not finished because it looks attractive in source code. Verify the rendered result, report what was and was not tested, and do not claim device or multi-user testing without evidence.
