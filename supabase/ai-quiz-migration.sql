-- AYFAR WORLD · private AI quiz sessions
-- Run in Supabase SQL Editor. Answers remain server-side; clients cannot select this table.
create table if not exists public.ayfar_ai_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references public.ayfar_games(id) on delete cascade,
  questions jsonb not null,
  current_index integer not null default 0 check (current_index between 0 and 14),
  submissions jsonb not null default '{}'::jsonb,
  results jsonb,
  status text not null default 'active' check (status in ('active','revealed','finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ayfar_ai_quiz_sessions enable row level security;
revoke all on public.ayfar_ai_quiz_sessions from anon, authenticated;
-- No client policies: only the Edge Function service role may read/write question answers.
