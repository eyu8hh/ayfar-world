# AYFAR gameplay update

## Changes in this branch

- The “Who knows the other?” round now collects each player's own answer and their guess in one view. Once both submit, each player sees both answers and judges whether the partner's guess is correct in meaning, not by exact string matching. A correct judgment awards the guesser one point.
- Game chat messages support synchronized ❤️ 😂 👏 😍 reactions stored in the existing shared game state.
- A player can start another challenge while an earlier match remains active. Leaving a game now explicitly communicates that it is paused; its server record remains resumable from the unfinished matches list.
- Player role aliases are normalized before game logic, preventing role-dependent answer fields from disappearing for the Farahati account.
- Star balance changes require a reason, and the history explicitly labels the recorded date and time. The existing `changed_at` database field is reused; no schema change is needed.
- Notifications now have an action that navigates to the relevant AYFAR section and marks only the selected notification as read.
- The existing daily-letter PNG export remains a handwritten-paper image. Its next visual refinement is intentionally awaiting the user's design approval.

## Supabase migration

Before testing multiple simultaneous active matches against the live Supabase project, run:

`supabase/migrations/202611070001_allow_multiple_active_games.sql`

This migration replaces the two challenge RPC functions to remove the active-match restriction and tightens the existing star-change RPC so a non-empty reason is required server-side. It does not alter tables, RLS policies, roles, accounts, existing game rows, or stored messages. It must be run in the Supabase SQL Editor by the project owner; this repository change does not apply it remotely.

## Safety and verification

No local storage is cleared. No existing game row is deleted. Pausing a game leaves its row in `playing` status and the match remains resumable. Permanent stop remains a separate explicit action.

Run `npm run check:js`, `npm run validate:html`, `npm run lint:css`, and `npm run test:e2e`. Test both Ayoub and Farahati accounts on separate devices before deploying.
