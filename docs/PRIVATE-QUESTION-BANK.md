# AYFAR private question-bank operations

The active game-answer keys are stored in the non-exposed `ayfar_private.game_question_bank` schema in Supabase. The browser receives only question text and options; correctness and explanations are returned only after both players submit.

## Important rules

- Never add `correct_answer`, answer explanations, or answer-bearing seed rows to files under `js/`.
- Never commit private answer rows in a SQL migration. The public migrations create the private schema, table, and RPCs only.
- The connected production Supabase project was seeded directly through the privileged database connection. The seed data is intentionally not stored in this public repository.
- A new Supabase project must receive a separately retained private seed backup through an administrator-only process before bank-backed games can run. Do not use a browser client, public Edge Function response, or a public SQL file to import answer keys.
- Keep the AI Quiz deferred until the manual JSON bank is supplied and separately reviewed.

## Historical exposure note

Earlier revisions of this public repository contained answer-bearing JavaScript and seed data. Removing those values from the current branch does not erase older Git commits. Fully removing historical copies would require a coordinated repository-history rewrite and force-push; that operation is intentionally not performed as part of this gameplay hardening.
