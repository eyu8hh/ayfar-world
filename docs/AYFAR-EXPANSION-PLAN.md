# AYFAR WORLD — Expansion plan (1500-question bank + shared features)

This document records the approved scope for the existing AYFAR WORLD project. It is additive: do not remove or replace existing features or user data.

## 1. Question bank — approved target: 1500

- Preserve the existing 557 curated questions unchanged.
- Add 946 new unique questions across exactly these three categories:
  - اللغة والأدب: 315 new questions
  - الحياة والطبيعة: 315 new questions
  - الفنون والثقافة: 316 new questions
- No sports category or sports questions in this expansion.
- Every multiple-choice item must have four distinct options, one unambiguous correct answer, a concise explanation, and one of three difficulty levels (سهل، متوسط، صعب).
- Questions must be Arabic, factually defensible, non-duplicative (including normalized Arabic text), and have stable unique IDs.
- Random selection must avoid repeating a question within the same match. Existing game scoring and per-question answer reveal behavior must remain unchanged.
- Current implementation checkpoint: 557 source records contain 554 unique question texts; three legacy duplicates are excluded from the runtime pool without deleting their source records. Batches 01–10 have been validated together: the runtime pool contains 1238 unique questions (554 unique legacy questions plus 684 accepted additions in the three expansion categories). Remaining to reach 1500: 262 questions (79 language & literature, 91 life & nature, 92 arts & culture).
- Do not label the bank as complete until a runtime count confirms exactly 1500 valid unique questions.

## 2. New games — design review before integration

### اللعبة 3: المحققان
A cooperative two-player investigation. Both players receive the same case file, then unlock evidence in synchronized rounds. Each round asks them to connect clues or choose the strongest inference. Players can discuss through the existing side chat. The final phase asks for a suspect, motive, and explanation. Score the quality of the shared conclusion and clue use, not who taps first. Include a short case, evidence log, hint limit, and a clear reveal/explanation at the end. Keep cases text-first and avoid requiring image assets.

### اللعبة 6: غرفة الهروب
A cooperative escape-room experience for both phones. Each room contains a sequence of linked puzzles; solving one unlocks the next for both players. Include a shared timer, synchronized puzzle state, optional limited hints, clear feedback after each puzzle, and a final escape result. Pausing/exiting must preserve the active room so it remains resumable from the games list; stopping must be explicit. Do not let simultaneous submissions award duplicate progress or points.

Both games must use the established two-player shared-match architecture and existing answer-reveal/scoring conventions. Present the rules and sample round for review before adding them to the live games menu.

## 3. Six approved shared features

1. **قائمة أحلامنا** — shared wish/bucket list; add, edit, complete, and archive wishes, with who added each item.
2. **مخطط مواعيدنا** — shared calendar of dates and plans; event title, date/time, optional notes, and reminder preference. Do not promise push notifications until the PWA notification capability is implemented and permission is granted.
3. **سؤال يومي** — one shared daily prompt; each partner submits a private answer, then both answers become visible when both have responded or the day closes. One response per partner per day, with retry-safe writes.
4. **ماذا نفعل اليوم؟** — a shared activity picker with categories such as at home, outdoors, food, film, and conversation. Both can spin/choose; save the agreed result as a plan if they want.
5. **أهداف مشتركة** — shared goals with a title, optional target date, progress steps, completion status, and activity history.
6. **صندوق المفاجآت** — private surprise notes/cards addressed to the other partner, with delivery/open state. Do not turn this into a memories/journal feature; no memories feature is requested.

## 4. Technical and privacy requirements

- Build on the current repository, Supabase project, authentication, and two existing profiles (Ayoub and Farahati).
- All shared records must be scoped to this couple and protected by Supabase Row Level Security. Never rely on hiding UI controls as authorization.
- A user may only create/update their own private daily answer or surprise sender record; the partner may read a surprise only when it is addressed to them and available for delivery.
- Every shared write must be idempotent or protected against duplicate submissions/retries, especially match progression, daily answers, and goal completion.
- Mobile-first Arabic RTL UI. Preserve Ayoub's masculine/fancy styling and Farahati's current visual identity; shared screens should harmonize both.
- Preserve existing authentication, messages, stars, game history, question bank, and all other data. No destructive database migration.
- Implement database migrations as additive SQL files and document the required Supabase migration step. Do not claim a migration is deployed until it is actually applied and verified.
- Add new scripts to index.html and the service-worker precache list, and bump the cache key whenever shipped assets change.
- Validate JavaScript syntax, bank integrity (exact total, unique IDs/questions, four options, valid correctAnswer), and shared two-phone behavior before calling a feature complete.

## 5. Suggested delivery order

1. Complete and validate the 1500-question bank.
2. Implement the six shared features' additive Supabase schema and RLS policies, then their mobile UI.
3. Present the two new game concepts with sample cases/rooms for review, then implement after approval.
4. Run regression checks across existing games, login, messages, stars, and offline/PWA caching.



## 6. Homepage information architecture (approved)
Organize the existing homepage into clear, jump-to sections while preserving its current content and behavior:
- **الرئيسية**: welcome, first-conversation counter, continue/resume match, unfinished matches.
- **عالمنا**: Ayoub/Farahati/shared points, first-conversation entry, daily check-in.
- **رسائلنا**: private messages.
- **الألعاب**: all existing games, with unfinished matches remaining easy to resume or stop.
- **خططنا**: the six new shared features (dream list, calendar, daily question, activity picker, shared goals, surprise box).
Use compact horizontally scrollable section navigation on mobile, smooth scrolling, clear active state, and harmonized Ayoub/Farahati themes. On larger screens, show the planned features in a three-column grid. Planned feature tiles remain informational until each feature is implemented; do not present them as working controls prematurely.
