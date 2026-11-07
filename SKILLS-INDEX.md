# Skills inventory and attribution

Project-scoped agent references are stored in `.agents/skills/`. They are not included in the deployed PWA runtime.

| Skill | Upstream source | License / terms | AYFAR use |
|---|---|---|---|
| frontend-design | `anthropics/skills` | Apache-2.0 | Project-adapted design craft checklist |
| theme-factory | `anthropics/skills` | Apache-2.0 | AYFAR palette documentation; no preset palette swap |
| design-taste-frontend | `Leonxlnx/taste-skill` | MIT | Visual craft and hierarchy |
| extract-design | `Manavarya09/design-extract` | MIT | Reference-site design extraction |
| gsap-core | `greensock/gsap-skills` | MIT | Motion reference; no runtime dependency added |
| gsap-performance | `greensock/gsap-skills` | MIT | Animation performance |
| gsap-scrolltrigger | `greensock/gsap-skills` | MIT | Scroll-linked animation reference |
| gsap-timeline | `greensock/gsap-skills` | MIT | Sequencing and timeline reference |
| impeccable | `pbakaus/impeccable` | Apache-2.0 | Audit, critique, and polish workflow |
| playwright-cli | `microsoft/playwright-cli` | Apache-2.0 | Browser automation workflow |
| react-bits | `DavidHDev/react-bits` | MIT + Commons Clause 1.0 | React-only catalog; reference inspiration only |
| transitions-dev | `Jakubantalik/transitions.dev` | Skill-specific terms; review upstream before redistribution | Motion reference |
| transitions-polish | `Jakubantalik/transitions.dev` | Skill-specific terms; review upstream before redistribution | Motion QA reference |

The historical skill files were recovered from this repository's existing `main` branch. The two Anthropic entries in this directory are concise AYFAR-specific adaptations, not verbatim upstream skill documents. Check each upstream repository's current license before redistributing the skill set outside this project.
