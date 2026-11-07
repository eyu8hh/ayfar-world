# AYFAR WORLD — Product context

AYFAR WORLD is a private, two-person relationship PWA for Ayoub and Farahati.

## Audience and use
- Exactly two authenticated people use the app, on Android and iPhone.
- Arabic is the primary interface language; concise English microcopy is welcome where it strengthens the editorial identity without reducing clarity.
- Mobile-first, right-to-left layout, with touch targets and readable type at 360–390 CSS pixels.

## Core outcomes
- A calm private home for daily letters, shared moments, and couple activities.
- Synchronous two-player games across separate phones.
- Clear, reassuring navigation and accessible controls.

## Non-negotiable product boundaries
- Preserve Supabase auth, roles, RLS, database schema, Edge Functions, synchronization, and existing user data.
- Preserve daily letter sequencing, the shared adjustable stars counter, the 7:00 PM first-conversation counter, and game state.
- Do not clear localStorage, IndexedDB, or sessions.
- Do not replace original assets under assets/brand/.
- No new framework unless it materially improves maintainability or user experience and can be introduced without destabilizing the working PWA.
