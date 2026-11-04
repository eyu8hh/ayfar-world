-- AYFAR WORLD · Shared dreams
-- Run this migration once in Supabase SQL Editor.
create table if not exists public.ayfar_shared_dreams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  details text not null default '' check (char_length(details) <= 500),
  created_by uuid not null references auth.users(id) on delete cascade,
  is_completed boolean not null default false,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ayfar_shared_dreams_created_at_idx
  on public.ayfar_shared_dreams (created_at desc);

alter table public.ayfar_shared_dreams enable row level security;

drop policy if exists "AYFAR pair can read shared dreams" on public.ayfar_shared_dreams;
create policy "AYFAR pair can read shared dreams"
on public.ayfar_shared_dreams for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')
));

drop policy if exists "AYFAR pair can add shared dreams" on public.ayfar_shared_dreams;
create policy "AYFAR pair can add shared dreams"
on public.ayfar_shared_dreams for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (select 1 from public.profiles p
    where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati'))
);

drop policy if exists "AYFAR pair can update shared dreams" on public.ayfar_shared_dreams;
create policy "AYFAR pair can update shared dreams"
on public.ayfar_shared_dreams for update to authenticated
using (exists (select 1 from public.profiles p
  where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')))
with check (exists (select 1 from public.profiles p
  where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));

drop policy if exists "AYFAR pair can delete shared dreams" on public.ayfar_shared_dreams;
create policy "AYFAR pair can delete shared dreams"
on public.ayfar_shared_dreams for delete to authenticated
using (exists (select 1 from public.profiles p
  where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')));

grant select, insert, update, delete on public.ayfar_shared_dreams to authenticated;

create or replace function public.ayfar_shared_dreams_touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ayfar_shared_dreams_updated_at on public.ayfar_shared_dreams;
create trigger ayfar_shared_dreams_updated_at
before update on public.ayfar_shared_dreams
for each row execute function public.ayfar_shared_dreams_touch_updated_at();

-- Enable Supabase Realtime for instant updates on both devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ayfar_shared_dreams'
  ) then
    alter publication supabase_realtime add table public.ayfar_shared_dreams;
  end if;
end $$;
