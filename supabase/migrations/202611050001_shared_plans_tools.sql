-- AYFAR WORLD · Daily question answers and shared goals
-- Run once in the Supabase SQL Editor after deploying the matching app update.

create table if not exists public.ayfar_daily_answers (
  id uuid primary key default gen_random_uuid(),
  question_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer text not null check (char_length(trim(answer)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_date, user_id)
);
create index if not exists ayfar_daily_answers_date_idx on public.ayfar_daily_answers(question_date);
alter table public.ayfar_daily_answers enable row level security;
drop policy if exists "AYFAR pair can read daily answers" on public.ayfar_daily_answers;
create policy "AYFAR pair can read daily answers" on public.ayfar_daily_answers for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR users can add own daily answer" on public.ayfar_daily_answers;
create policy "AYFAR users can add own daily answer" on public.ayfar_daily_answers for insert to authenticated
with check (user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR users can update own daily answer" on public.ayfar_daily_answers;
create policy "AYFAR users can update own daily answer" on public.ayfar_daily_answers for update to authenticated
using (user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')))
with check (user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
grant select,insert,update on public.ayfar_daily_answers to authenticated;

create table if not exists public.ayfar_shared_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  details text not null default '' check (char_length(details) <= 500),
  target_date date,
  progress integer not null default 0 check (progress between 0 and 100),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ayfar_shared_goals_created_at_idx on public.ayfar_shared_goals(created_at desc);
alter table public.ayfar_shared_goals enable row level security;
drop policy if exists "AYFAR pair can read shared goals" on public.ayfar_shared_goals;
create policy "AYFAR pair can read shared goals" on public.ayfar_shared_goals for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR pair can add shared goals" on public.ayfar_shared_goals;
create policy "AYFAR pair can add shared goals" on public.ayfar_shared_goals for insert to authenticated
with check (created_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR pair can update shared goals" on public.ayfar_shared_goals;
create policy "AYFAR pair can update shared goals" on public.ayfar_shared_goals for update to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR pair can delete shared goals" on public.ayfar_shared_goals;
create policy "AYFAR pair can delete shared goals" on public.ayfar_shared_goals for delete to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
grant select,insert,update,delete on public.ayfar_shared_goals to authenticated;

create or replace function public.ayfar_plans_touch_updated_at()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists ayfar_daily_answers_updated_at on public.ayfar_daily_answers;
create trigger ayfar_daily_answers_updated_at before update on public.ayfar_daily_answers
for each row execute function public.ayfar_plans_touch_updated_at();
drop trigger if exists ayfar_shared_goals_updated_at on public.ayfar_shared_goals;
create trigger ayfar_shared_goals_updated_at before update on public.ayfar_shared_goals
for each row execute function public.ayfar_plans_touch_updated_at();

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_daily_answers') then
    alter publication supabase_realtime add table public.ayfar_daily_answers;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_shared_goals') then
    alter publication supabase_realtime add table public.ayfar_shared_goals;
  end if;
end $$;
