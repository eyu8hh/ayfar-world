-- AYFAR WORLD: harden callable database functions and reduce RLS/FK query overhead.
-- This migration preserves table data, role values, and row-level access semantics.

begin;

-- Trigger functions are invoked by PostgreSQL triggers, not by PostgREST RPC.
-- Remove their default PUBLIC/API execution grants without changing trigger bindings.
revoke all on function public.ayfar_notify_daily_rating() from public, anon, authenticated;
revoke all on function public.ayfar_notify_habit_checkin() from public, anon, authenticated;
revoke all on function public.ayfar_notify_music_added() from public, anon, authenticated;
revoke all on function public.ayfar_notify_pet_care() from public, anon, authenticated;
revoke all on function public.ayfar_notify_routine_status() from public, anon, authenticated;
revoke all on function public.ayfar_notify_star_change() from public, anon, authenticated;

-- Character-game helper and RPCs require an authenticated AYFAR profile.
revoke all on function public.ayfar_character_role() from public, anon;
grant execute on function public.ayfar_character_role() to authenticated;

revoke all on function public.character_game_act(text, jsonb) from public, anon;
grant execute on function public.character_game_act(text, jsonb) to authenticated;

revoke all on function public.character_game_get() from public, anon;
grant execute on function public.character_game_get() to authenticated;

-- Evaluate auth.uid() once per statement rather than once per candidate row.
-- Only the expression form changes; policy names, commands, roles, and predicates
-- remain otherwise unchanged.
do $$
declare
  policy_row record;
  using_expression text;
  check_expression text;
begin
  for policy_row in
    select
      p.polname,
      p.polcmd,
      c.relname as table_name,
      n.nspname as schema_name,
      case when p.polqual is not null then pg_get_expr(p.polqual, p.polrelid) end as using_sql,
      case when p.polwithcheck is not null then pg_get_expr(p.polwithcheck, p.polrelid) end as check_sql
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%auth.uid()%'
        or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%auth.uid()%'
      )
  loop
    using_expression := replace(policy_row.using_sql, 'auth.uid()', '(select auth.uid())');
    check_expression := replace(policy_row.check_sql, 'auth.uid()', '(select auth.uid())');

    if policy_row.polcmd = 'r' then
      execute format(
        'alter policy %I on %I.%I using (%s)',
        policy_row.polname, policy_row.schema_name, policy_row.table_name, using_expression
      );
    elsif policy_row.polcmd = 'a' then
      execute format(
        'alter policy %I on %I.%I with check (%s)',
        policy_row.polname, policy_row.schema_name, policy_row.table_name, check_expression
      );
    elsif policy_row.polcmd = 'w' or policy_row.polcmd = '*' then
      execute format(
        'alter policy %I on %I.%I using (%s) with check (%s)',
        policy_row.polname, policy_row.schema_name, policy_row.table_name,
        using_expression, check_expression
      );
    elsif policy_row.polcmd = 'd' then
      execute format(
        'alter policy %I on %I.%I using (%s)',
        policy_row.polname, policy_row.schema_name, policy_row.table_name, using_expression
      );
    end if;
  end loop;
end
$$;

-- Remove duplicate private-message SELECT policy and the narrower Ayoub-only
-- INSERT policy. The remaining policies already cover these exact cases:
-- participants can read their own messages; both can send in either direction.
drop policy if exists "participants can read their messages" on public.private_messages;
drop policy if exists "Ayoub can send messages to Farahati" on public.private_messages;

-- Cover the foreign-key columns identified by the Supabase performance advisor.
create index if not exists ayfar_daily_answers_user_id_idx on public.ayfar_daily_answers (user_id);
create index if not exists ayfar_game_challenges_game_id_idx on public.ayfar_game_challenges (game_id);
create index if not exists ayfar_game_secrets_owner_id_idx on public.ayfar_game_secrets (owner_id);
create index if not exists ayfar_habit_checkins_checked_by_idx on public.ayfar_habit_checkins (checked_by);
create index if not exists ayfar_habit_checkins_habit_owner_idx on public.ayfar_habit_checkins (habit_owner);
create index if not exists ayfar_habits_user_id_idx on public.ayfar_habits (user_id);
create index if not exists ayfar_notifications_actor_id_idx on public.ayfar_notifications (actor_id);
create index if not exists ayfar_pet_care_log_cared_by_idx on public.ayfar_pet_care_log (cared_by);
create index if not exists ayfar_shared_calendar_created_by_idx on public.ayfar_shared_calendar (created_by);
create index if not exists ayfar_shared_dreams_completed_by_idx on public.ayfar_shared_dreams (completed_by);
create index if not exists ayfar_shared_dreams_created_by_idx on public.ayfar_shared_dreams (created_by);
create index if not exists ayfar_shared_goals_created_by_idx on public.ayfar_shared_goals (created_by);
create index if not exists ayfar_shared_music_added_by_idx on public.ayfar_shared_music (added_by);
create index if not exists ayfar_star_history_changed_by_idx on public.ayfar_star_history (changed_by);
create index if not exists game_images_collection_id_idx on public.game_images (collection_id);
create index if not exists game_images_uploaded_by_idx on public.game_images (uploaded_by);
create index if not exists image_collections_created_by_idx on public.image_collections (created_by);

commit;
