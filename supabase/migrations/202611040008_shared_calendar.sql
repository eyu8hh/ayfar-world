-- AYFAR WORLD · Shared calendar for Ayoub and Farahati
create table if not exists public.ayfar_shared_calendar (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  starts_at timestamptz not null,\n  all_day boolean not null default false,
  category text not null default 'خاص' check (category in ('خاص','مناسبة','خطة','تذكير')),
  notes text not null default '' check (char_length(notes) <= 500),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ayfar_shared_calendar_starts_at_idx on public.ayfar_shared_calendar(starts_at);
alter table public.ayfar_shared_calendar enable row level security;
drop policy if exists "AYFAR pair can read calendar" on public.ayfar_shared_calendar;
create policy "AYFAR pair can read calendar" on public.ayfar_shared_calendar for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR pair can add calendar events" on public.ayfar_shared_calendar;
create policy "AYFAR pair can add calendar events" on public.ayfar_shared_calendar for insert to authenticated
with check (created_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
drop policy if exists "AYFAR pair can delete calendar events" on public.ayfar_shared_calendar;
create policy "AYFAR pair can delete calendar events" on public.ayfar_shared_calendar for delete to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));
grant select,insert,delete on public.ayfar_shared_calendar to authenticated;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_shared_calendar') then
    alter publication supabase_realtime add table public.ayfar_shared_calendar;
  end if;
end $$;
