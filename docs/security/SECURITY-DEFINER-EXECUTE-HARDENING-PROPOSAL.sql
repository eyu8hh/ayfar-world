-- AYFAR WORLD — SECURITY REVIEW PROPOSAL ONLY
-- DO NOT RUN THIS FILE until the project owner reviews and explicitly approves it.
-- This file is documentation/proposal, NOT a migration. It is intentionally outside
-- supabase/migrations so it cannot be picked up by migration automation.
--
-- Purpose: remove PostgreSQL's default PUBLIC EXECUTE privilege from the inspected
-- SECURITY DEFINER RPCs, then grant EXECUTE only to authenticated users.
-- Existing function bodies and business rules are not changed.
--
-- Apply only after checking the live database signatures and testing both accounts.

begin;

-- Core synchronized game RPCs (supabase/ayfar-games.sql)
revoke execute on function public.ayfar_game_create(text,jsonb) from public, anon;
grant execute on function public.ayfar_game_create(text,jsonb) to authenticated;

revoke execute on function public.ayfar_game_join(uuid) from public, anon;
grant execute on function public.ayfar_game_join(uuid) to authenticated;

revoke execute on function public.ayfar_game_update(uuid,bigint,jsonb,text) from public, anon;
grant execute on function public.ayfar_game_update(uuid,bigint,jsonb,text) to authenticated;

-- Private game secrets (supabase/ayfar-private-secrets.sql)
revoke execute on function public.ayfar_game_set_secret(uuid,bigint,text) from public, anon;
grant execute on function public.ayfar_game_set_secret(uuid,bigint,text) to authenticated;

revoke execute on function public.ayfar_game_guess_secret(uuid,bigint,text) from public, anon;
grant execute on function public.ayfar_game_guess_secret(uuid,bigint,text) to authenticated;

-- Direct game challenges (supabase/migrations/202611040003_add_direct_game_challenges.sql)
revoke execute on function public.ayfar_challenge_send(text,jsonb) from public, anon;
grant execute on function public.ayfar_challenge_send(text,jsonb) to authenticated;

revoke execute on function public.ayfar_challenge_accept(uuid) from public, anon;
grant execute on function public.ayfar_challenge_accept(uuid) to authenticated;

revoke execute on function public.ayfar_challenge_reject(uuid) from public, anon;
grant execute on function public.ayfar_challenge_reject(uuid) to authenticated;

revoke execute on function public.ayfar_challenge_cancel(uuid) from public, anon;
grant execute on function public.ayfar_challenge_cancel(uuid) to authenticated;

-- Daily letters and shared stars (supabase/love-letters-and-stars.sql)
revoke execute on function public.get_daily_love_letter() from public, anon;
grant execute on function public.get_daily_love_letter() to authenticated;

revoke execute on function public.open_daily_love_letter(uuid) from public, anon;
grant execute on function public.open_daily_love_letter(uuid) to authenticated;

revoke execute on function public.change_ayfar_stars(bigint,text) from public, anon;
grant execute on function public.change_ayfar_stars(bigint,text) to authenticated;

commit;

-- Before applying:
-- 1) Confirm these exact signatures exist in the live Supabase database.
-- 2) Check any scheduled jobs, Edge Functions, or server-side callers that may rely
--    on anon/PUBLIC execution; this proposal assumes authenticated RPC calls only.
-- 3) Test both Ayoub and Farahati: login, game create/join/update, secret flows,
--    challenge send/accept/reject/cancel, daily letter open, and stars adjustment.
-- 4) Keep a rollback plan. To restore the prior default, grant EXECUTE back to PUBLIC,
--    but do not do so without an explicit security decision.
