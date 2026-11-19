const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("Supabase hardening migration limits direct function execution and preserves authenticated game RPCs", async () => {
  const migration = read("supabase/migrations/20261119120000_supabase_security_performance_hardening.sql");
  for (const fn of [
    "ayfar_notify_daily_rating",
    "ayfar_notify_habit_checkin",
    "ayfar_notify_music_added",
    "ayfar_notify_pet_care",
    "ayfar_notify_routine_status",
    "ayfar_notify_star_change"
  ]) {
    expect(migration).toContain(`revoke all on function public.${fn}() from public, anon, authenticated`);
  }
  expect(migration).toContain("grant execute on function public.character_game_act(text, jsonb) to authenticated");
  expect(migration).toContain("grant execute on function public.character_game_get() to authenticated");
  expect(migration).toContain("grant execute on function public.ayfar_character_role() to authenticated");
  expect(migration).toContain("replace(policy_row.using_sql, 'auth.uid()', '(select auth.uid())')");
});

test("Supabase hardening migration removes only redundant private-message policies and indexes audited foreign keys", async () => {
  const migration = read("supabase/migrations/20261119120000_supabase_security_performance_hardening.sql");
  expect(migration).toContain('drop policy if exists "participants can read their messages" on public.private_messages');
  expect(migration).toContain('drop policy if exists "Ayoub can send messages to Farahati" on public.private_messages');
  for (const index of [
    "ayfar_daily_answers_user_id_idx",
    "ayfar_game_challenges_game_id_idx",
    "ayfar_game_secrets_owner_id_idx",
    "ayfar_habit_checkins_checked_by_idx",
    "ayfar_habit_checkins_habit_owner_idx",
    "ayfar_habits_user_id_idx",
    "ayfar_notifications_actor_id_idx",
    "ayfar_pet_care_log_cared_by_idx",
    "ayfar_shared_calendar_created_by_idx",
    "ayfar_shared_dreams_completed_by_idx",
    "ayfar_shared_dreams_created_by_idx",
    "ayfar_shared_goals_created_by_idx",
    "ayfar_shared_music_added_by_idx",
    "ayfar_star_history_changed_by_idx",
    "game_images_collection_id_idx",
    "game_images_uploaded_by_idx",
    "image_collections_created_by_idx"
  ]) expect(migration).toContain(index);
  expect(migration).not.toMatch(/\b(drop table|truncate|delete from|drop column)\b/i);
});
