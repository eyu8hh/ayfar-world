-- AYFAR WORLD · weekly routines, habits and partner-care avatars
-- Additive migration. Run once in Supabase SQL Editor after deploying this update.

create table if not exists public.ayfar_routine_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  category text not null default 'daily' check (char_length(category) between 1 and 30),
  start_time time not null,
  end_time time,
  days smallint[] not null default array[1,2,3,4,5]::smallint[],
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  created_at timestamptz not null default now(),
  check (end_time is null or end_time > start_time),
  check (cardinality(days) between 1 and 7),
  check (days <@ array[0,1,2,3,4,5,6]::smallint[])
);
create index if not exists ayfar_routine_schedule_user_idx on public.ayfar_routine_schedule(user_id,start_time);
alter table public.ayfar_routine_schedule enable row level security;
drop policy if exists "AYFAR schedule read own and shared partner" on public.ayfar_routine_schedule;
create policy "AYFAR schedule read own and shared partner" on public.ayfar_routine_schedule for select to authenticated
using (user_id=auth.uid() or (visibility='shared' and public.ayfar_is_routine_partner(user_id)));
drop policy if exists "AYFAR schedule manage own" on public.ayfar_routine_schedule;
create policy "AYFAR schedule manage own" on public.ayfar_routine_schedule for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select,insert,update,delete on public.ayfar_routine_schedule to authenticated;

create table if not exists public.ayfar_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  icon text not null default '🌱' check (char_length(icon) between 1 and 12),
  frequency text not null default 'daily' check (frequency in ('daily','weekly')),
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  created_at timestamptz not null default now()
);
alter table public.ayfar_habits enable row level security;
drop policy if exists "AYFAR habits read own and shared partner" on public.ayfar_habits;
create policy "AYFAR habits read own and shared partner" on public.ayfar_habits for select to authenticated
using (user_id=auth.uid() or (visibility='shared' and public.ayfar_is_routine_partner(user_id)));
drop policy if exists "AYFAR habits manage own" on public.ayfar_habits;
create policy "AYFAR habits manage own" on public.ayfar_habits for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select,insert,update,delete on public.ayfar_habits to authenticated;

create table if not exists public.ayfar_habit_checkins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.ayfar_habits(id) on delete cascade,
  habit_owner uuid not null references auth.users(id) on delete cascade,
  check_date date not null default current_date,
  checked_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(habit_id,check_date)
);
alter table public.ayfar_habit_checkins enable row level security;
drop policy if exists "AYFAR checkins read allowed habit" on public.ayfar_habit_checkins;
create policy "AYFAR checkins read allowed habit" on public.ayfar_habit_checkins for select to authenticated
using (habit_owner=auth.uid() or exists (
  select 1 from public.ayfar_habits h where h.id=habit_id and h.user_id=habit_owner
  and h.visibility='shared' and public.ayfar_is_routine_partner(h.user_id)
));
drop policy if exists "AYFAR checkins mark shared habit" on public.ayfar_habit_checkins;
create policy "AYFAR checkins mark shared habit" on public.ayfar_habit_checkins for insert to authenticated
with check (checked_by=auth.uid() and exists (
  select 1 from public.ayfar_habits h where h.id=habit_id and h.user_id=habit_owner
  and (h.user_id=auth.uid() or (h.visibility='shared' and public.ayfar_is_routine_partner(h.user_id)))
));
drop policy if exists "AYFAR checkins undo allowed habit" on public.ayfar_habit_checkins;
create policy "AYFAR checkins undo allowed habit" on public.ayfar_habit_checkins for delete to authenticated
using (exists (
  select 1 from public.ayfar_habits h where h.id=habit_id and h.user_id=habit_owner
  and (h.user_id=auth.uid() or (h.visibility='shared' and public.ayfar_is_routine_partner(h.user_id)))
));
grant select,insert,delete on public.ayfar_habit_checkins to authenticated;

create table if not exists public.ayfar_pets (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  pet_name text not null default 'رفيقنا' check (char_length(trim(pet_name)) between 1 and 24),
  species text not null default 'cat' check (species in ('cat','bunny','fox','bear')),
  level integer not null default 1 check (level between 1 and 1000),
  xp integer not null default 0 check (xp >= 0),
  hunger integer not null default 82 check (hunger between 0 and 100),
  thirst integer not null default 82 check (thirst between 0 and 100),
  energy integer not null default 82 check (energy between 0 and 100),
  hygiene integer not null default 82 check (hygiene between 0 and 100),
  happiness integer not null default 82 check (happiness between 0 and 100),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.ayfar_pets enable row level security;
drop policy if exists "AYFAR pair read both pets" on public.ayfar_pets;
create policy "AYFAR pair read both pets" on public.ayfar_pets for select to authenticated
using (owner_id=auth.uid() or public.ayfar_is_routine_partner(owner_id));
drop policy if exists "AYFAR owner creates pet" on public.ayfar_pets;
create policy "AYFAR owner creates pet" on public.ayfar_pets for insert to authenticated with check (owner_id=auth.uid());
drop policy if exists "AYFAR owner updates pet profile" on public.ayfar_pets;
create policy "AYFAR owner updates pet profile" on public.ayfar_pets for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update on public.ayfar_pets to authenticated;

create table if not exists public.ayfar_pet_care_log (
  id uuid primary key default gen_random_uuid(),
  pet_owner uuid not null references auth.users(id) on delete cascade,
  cared_by uuid not null references auth.users(id) on delete cascade,
  action_key text not null check (action_key in ('feed','water','play','sleep','bath','gift','cuddle','clean')),
  created_at timestamptz not null default now()
);
create index if not exists ayfar_pet_care_log_owner_idx on public.ayfar_pet_care_log(pet_owner,created_at desc);
alter table public.ayfar_pet_care_log enable row level security;
drop policy if exists "AYFAR pair read pet care log" on public.ayfar_pet_care_log;
create policy "AYFAR pair read pet care log" on public.ayfar_pet_care_log for select to authenticated
using (pet_owner=auth.uid() or public.ayfar_is_routine_partner(pet_owner));
grant select on public.ayfar_pet_care_log to authenticated;

create or replace function public.ayfar_care_for_pet(p_pet_owner uuid,p_action text)
returns public.ayfar_pets
language plpgsql security definer
set search_path=public,auth
as $function$
declare p public.ayfar_pets; v_xp integer:=8;
begin
  if p_action not in ('feed','water','play','sleep','bath','gift','cuddle','clean') then
    raise exception 'Unknown care action';
  end if;
  if not public.ayfar_is_routine_partner(p_pet_owner) then
    raise exception 'Only the partner can care for this avatar';
  end if;
  if exists(select 1 from public.ayfar_pet_care_log
    where pet_owner=p_pet_owner and cared_by=auth.uid() and action_key=p_action
      and created_at > now()-interval '90 seconds') then
    raise exception 'Please wait a little before repeating this action';
  end if;
  update public.ayfar_pets set
    hunger=least(100,hunger+case when p_action='feed' then 28 else 0 end),
    thirst=least(100,thirst+case when p_action='water' then 30 else 0 end),
    energy=least(100,energy+case when p_action='sleep' then 32 when p_action='play' then -14 else 0 end),
    hygiene=least(100,hygiene+case when p_action='bath' then 32 when p_action='clean' then 18 else 0 end),
    happiness=least(100,happiness+case when p_action='play' then 24 when p_action='gift' then 28 when p_action='cuddle' then 18 else 0 end),
    xp=xp+v_xp, level=least(1000,((xp+v_xp)/100)+1), updated_at=now()
  where owner_id=p_pet_owner returning * into p;
  if not found then raise exception 'Avatar not created yet'; end if;
  insert into public.ayfar_pet_care_log(pet_owner,cared_by,action_key) values(p_pet_owner,auth.uid(),p_action);
  return p;
end;
$function$;
revoke all on function public.ayfar_care_for_pet(uuid,text) from public,anon;
grant execute on function public.ayfar_care_for_pet(uuid,text) to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_routine_schedule') then alter publication supabase_realtime add table public.ayfar_routine_schedule; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_habits') then alter publication supabase_realtime add table public.ayfar_habits; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_habit_checkins') then alter publication supabase_realtime add table public.ayfar_habit_checkins; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_pets') then alter publication supabase_realtime add table public.ayfar_pets; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_pet_care_log') then alter publication supabase_realtime add table public.ayfar_pet_care_log; end if;
end $$;
