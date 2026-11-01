# AYFAR WORLD — Handoff for a new ChatGPT account

This document transfers the working context for continuing AYFAR WORLD in another ChatGPT account. It is a project handoff, not a copy of the original ChatGPT conversation or account memory.

## Project links
- GitHub repository: https://github.com/eyu8hh/ayfar-world
- Main branch: `main`
- Live site: https://eyu8hh.github.io/ayfar-world/
- Backup branch: `backup/pre-redesign-2026-11-01`
- Backup branch was created from commit `9a759fbf4fbb78484e4838714cd0bfb5e7680346` before the later work. It is a Git source backup, not a backup of Supabase cloud data.

## Product identity
AYFAR WORLD is a romantic, calm, two-person shared games and experiences website for Ayoub and Farah/Farhati. It uses Supabase for shared synchronization. Preserve the existing AYFAR identity; do not redesign it from scratch. Focus on effectiveness, reliability, and visual consistency.

## Non-negotiable working rules
1. Inspect the current repository and relevant files before changing anything. The live branch may have advanced since this handoff was written.
2. Never restart or rebuild the project from scratch.
3. Never delete an existing feature unless the owner explicitly asks.
4. Preserve all existing progress and data. Make small, focused commits and explain each change.
5. Do not claim a feature works on two phones unless it was actually tested on two devices. Syntax checks are not functional tests.
6. Review Supabase SQL, RLS policies, RPCs, and client code together before making claims about security or synchronization.
7. Do not expose, request, or commit Supabase service-role keys, passwords, tokens, or other secrets. Use environment/configuration guidance for secrets.
8. When a user reports a bug, reproduce or trace the actual current code path before proposing a fix.
9. Keep user-facing explanations in Arabic unless asked otherwise.

## Project-scoped design skill
The repository already contains the Impeccable skill under:
`.agents/skills/impeccable/`
Start by reading:
- `.agents/skills/impeccable/SKILL.md`
- `.agents/skills/impeccable/critique.md`
- `.agents/skills/impeccable/audit.md`
Read other references when relevant.

This skill is intentionally stored inside this repository so it applies to this project, not globally to the user's device. Treat it as design guidance. Do not claim slash commands are automatically executable in ChatGPT unless the connected coding environment explicitly supports them.

## Current known project structure
- `index.html`: app shell and asset versions
- `css/app.css`: styling
- `js/app.js`: navigation and main app flow
- `js/games.js`: games, rooms, shared game state and synchronization
- `js/storage.js`: local persistence
- `js/auth.js`, `js/messages.js`, `js/love-letters.js`: authentication and communication features
- `service-worker.js`: cache/version handling
- `supabase/`: SQL schema, policies, RPCs and feature migrations
- `GAMES-SPEC.md`, `tests/TEST-REPORT.md`: game specification and test notes (verify against current code; documentation may be stale)

## Games and latest known state
The XO game was explicitly removed at the owner's request because it continued to have a serious winner-detection problem.
The removal covered its menu entry, metadata, game logic/handlers and related service-worker/cache references. The catalogue was reduced from 12 to 11 games. Do not restore XO unless explicitly requested.

The remaining 11 games are:
1. من يعرف الآخر أكثر؟
2. هذا أم ذاك؟
3. سؤال وجواب
4. صراحة أم تحدي
5. تحدي السرعة
6. ماذا سيختار؟
7. اكتشف الاختلاف
8. اختبار التوافق
9. عشرون سؤالاً
10. خمن الكلمة
11. من أكون؟ – الألغاز

The owner previously confirmed the first three games worked in their tests, including synchronized answers and progression in game three. Game four has a skip action that stores `[تم التخطي]` and advances after both players answer/skip, but it was not confirmed as fully tested. Testing was being continued one game at a time.

## Known technical concerns to investigate
- Verify room lifecycle and synchronization paths: save, watch, restore, start, join, cleanup.
- Verify refresh recovery: room ID is stored in localStorage as `ayfar_active_room_v1`; restore fetches the room and reinstates role/state, then watches and renders. This was syntax-checked, but real-world RLS and two-device behavior still need validation.
- Verify concurrent moves: rejected simultaneous updates may not be retried/reconciled.
- Verify secret answers: some games historically stored secret data in shared room state (notably Twenty Questions and Word Guess). Assess whether secrets are exposed to the other player through client-readable rows. Prefer private state and server-side validation where appropriate.
- Verify turn/role authorization and whether `supabase/ayfar-games-hardening.sql` has actually been applied in the Supabase project. Never assume a migration was run just because the file exists.
- Check current SQL/RLS and code before implementing changes; do not assume old observations still describe current HEAD.

## Improvements approved by the owner
The owner approved the previously discussed improvement set, with this priority:
1. Stabilize games, synchronization, refresh/reconnect and room restoration.
2. Improve the home page: consistent game cards, resume where left off, recent activity, achievements/points where supported.
3. Standardize game UI: waiting states, player connection/turn indicators, match history, replay, consistent question/reveal/result screens, recovery after disconnect.
4. Add/improve “Memories”: photos, archived messages, shared experiences and important dates.
5. Improve messaging: notifications, reactions, pinned messages, scheduled messages and unread indicators.
6. Polish mobile spacing/sizing, transitions, loading/error states, reduced motion and dark mode.

Keep the calm romantic visual identity. Do not sacrifice reliability for decorative effects.

## Latest known commits
The latest known XO-removal sequence on main:
- `97749802a2537987894c4d92ff78783b0a40e0a9`
- `8b743078fd43ad32a8e9899d08b1f697361b4341`
- `ae45dbbb313bb29337f762e8f0d2161f69c2b718`
- `9ffdf4b50f340010dabc0b3ba5282fc87d5fbde0`
- `49628911224c71ebc71c9021b295457301ce1e44`

These are historical pointers. Always fetch the latest main branch and inspect its tree/commit before acting.

## Connecting the new ChatGPT account to GitHub
1. Sign in to the other ChatGPT account.
2. Open ChatGPT Settings and find the Apps/Connectors or Plugins area (the exact label can vary by client/version).
3. Find GitHub and connect the GitHub account that has access to `eyu8hh/ayfar-world`.
4. Approve only the repository access needed for this project if GitHub offers repository selection.
5. In a new ChatGPT conversation, confirm that GitHub is connected and that the assistant can read `eyu8hh/ayfar-world` on branch `main`.
6. If the repository is private, the GitHub account connected in the new ChatGPT account must itself have permission to access it. A ChatGPT conversation transfer does not grant GitHub permissions.
7. Do not paste personal access tokens or passwords into chat.

## First instruction to give the new ChatGPT account
Read this file first, then inspect the current `main` branch and the project-scoped Impeccable skill. Summarize the actual current state and any differences from this handoff. Do not modify files until the owner confirms the next task. Preserve all existing functionality and data, and work in small commits.
