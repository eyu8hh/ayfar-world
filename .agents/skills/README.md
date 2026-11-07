# AYFAR WORLD project skills

These project-scoped skills are kept here so compatible coding agents can discover them from the repository. They are not part of the public PWA runtime and must never be linked from `index.html` or cached by the service worker.

See [DESIGN-SKILLS.md](../../DESIGN-SKILLS.md) for AYFAR-specific operating rules and [SKILLS-INDEX.md](../../SKILLS-INDEX.md) for source and license attribution.

## Compatibility notes

- AYFAR is a vanilla HTML/CSS/JavaScript PWA, not a React project.
- GSAP and React Bits are reference-only unless a separate, explicit implementation decision is made.
- Do not execute `rb-add.mjs` without reviewing the exact component, dependencies, and target files first.
- Skill files are guidance, not permission to change authentication, database policies, user data, secrets, or production behavior.
