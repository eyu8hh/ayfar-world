# P0.1 — Strict Game Security Baseline

**Branch:** `security/p0-1-authoritative-game-engine`  
**Baseline commit:** `787b4d2d98e753ddd418b1aaae05155e3b43a621`  
**Scope:** game-session integrity, trusted scoring, participant ownership, challenge initialization, and reconnect-safe state transitions.  
**Production changes:** none. This document records read-only findings and the implementation contract; it does not apply SQL or deploy functions.

## Verified baseline

Repository files reviewed:
- `js/games.js`
- `supabase/ayfar-games.sql`
- `supabase/ayfar-games-hardening.sql`
- `supabase/ayfar-private-secrets.sql`
- `supabase/migrations/202611040003_add_direct_game_challenges.sql`
- `supabase/migrations/202611040005_atomic_ai_quiz_submissions.sql`
- `supabase/migrations/202611040006_recoverable_ai_quiz_grading.sql`
- `supabase/functions/ayfar-ai-quiz/index.ts`

Read-only inspection of the linked production database confirmed:
- `public.ayfar_games` has 33 rows and RLS enabled.
- `public.ayfar_game_challenges` has 23 rows and RLS enabled.
- `public.ayfar_game_secrets` exists and has RLS enabled.
- `public.ayfar_ai_quiz_sessions` exists and has RLS enabled.
- The game tables have participant-only SELECT policies; the secrets table has an owner-only SELECT policy.
- The current production `ayfar_game_update(uuid,bigint,jsonb,text)` is SECURITY DEFINER and executable by authenticated users, and accepts a complete client-provided JSON state.
- The production `ayfar_game_join(uuid)` currently does not enforce that the joining profile has the opposite AYFAR role from the host.
- The production challenge-accept function creates the match using the challenge's stored state.
- The repository contains a separate proposed hardening SQL file, but the production function definition still lacks its opposite-role check.
- The production migration history currently reports only two entries, while the repository contains additional SQL migration files. This is recorded as a deployment-state warning; migration reconciliation belongs to the separate audit track and must not be inferred from repository filenames.

## Findings

### P0.1-01 — Client controls the complete match state (critical)

`ayfar_game_update` checks authentication, participation, and optimistic version. It does not validate which JSON fields the caller may change, whether the current actor owns a submitted answer, whether a phase transition is legal, or whether score changes follow game rules.

A participant can therefore submit a replacement state that changes both players' answers, score totals, round number, timer fields, chat data, and phase/status. Version checking prevents stale writes, not malicious writes.

### P0.1-02 — Challenge creation accepts client-authored initial state (high)

`ayfar_challenge_send` accepts `p_state` and stores it in the challenge. The acceptance function copies that state into `ayfar_games`. Initial scores, question order, round, phase, and arbitrary extra fields are therefore not server-authenticated.

### P0.1-03 — Public client bundle contains answer keys (high)

The browser loads question banks and answer data from JavaScript. A player can inspect the downloaded bundle and discover correct answers before answering. The AI quiz challenge state also includes `aiLocalQuestions`, including each local question's `answer`, in the match JSON.

### P0.1-04 — Legacy join path does not enforce the two-role pairing (high)

The current production `ayfar_game_join` verifies that the caller is an allowed profile and that the slot is open, but it does not require an Ayoub host to be joined by Farahati (and vice versa). The repository's `ayfar-games-hardening.sql` contains that check, but the live definition differs.

### P0.1-05 — Game rules are split between browser and database (high)

Scoring and state transitions are calculated in `js/games.js`; the database stores the submitted result without independently verifying game-specific rules. This makes client-side guards (such as one answer per round or one score per round) bypassable.

## Required target design

1. Keep `ayfar_games` as the durable match record so existing history and resumable games are preserved.
2. Replace generic full-state mutation with explicit, typed game actions. The server derives the actor from `auth.uid()`; it never accepts a caller-supplied role as authority.
3. Keep question answer keys in a server-only source. The client receives only the current prompt and answer options until both players have submitted.
4. Server-side scoring is idempotent and calculated from immutable question data plus both submissions.
5. Store each player's submission under that player's authenticated identity; reject attempts to write the other participant's answer.
6. Validate every state transition against the current phase, round, participant pair, expected version, and game key.
7. Use server time for speed-game deadlines; clients only display the remaining time.
8. Validate challenge game keys and create a canonical initial state on the server. Ignore client-supplied scores, phase, round, question keys, and arbitrary state fields.
9. Preserve old completed match rows and provide a compatibility path for active matches before retiring the unsafe update RPC.
10. Keep game chat/reactions as a separate action domain so chat changes cannot alter gameplay or scores.

## Implementation and verification gates

- [ ] Define the authoritative action contract for each currently enabled game key.
- [ ] Inventory all callers of `ayfar_game_update` and all state fields used by each game.
- [ ] Add server-only question/answer data for bank-backed games; do not copy answer keys into public match state.
- [ ] Add atomic, idempotent server actions for submit, judge/reveal, advance, timeout, pause/resume, and finish as applicable.
- [ ] Enforce the Ayoub/Farahati participant pairing in both challenge and legacy join paths.
- [ ] Add automated tests for forged scores, forged opponent answers, duplicate submissions, duplicate scoring, stale versions, invalid transitions, unauthorized participants, same-role joining, hidden answer keys, and reconnect/resume.
- [ ] Verify existing completed and in-progress match compatibility without modifying production rows.
- [ ] Run the repository quality checks and targeted security tests.
- [ ] Review the migration against the live schema before any database application.
- [ ] Obtain explicit user approval before applying SQL to Supabase, deploying an Edge Function, merging a PR, or publishing a new site version.

## Explicit non-actions

- No production SQL has been applied.
- No Edge Function has been deployed.
- No existing game, row, score, account, role, or permission has been deleted or modified.
- No pull request has been merged.
- No GitHub Pages deployment has been triggered by this branch.
