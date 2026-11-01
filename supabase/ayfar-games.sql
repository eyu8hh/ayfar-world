-- AYFAR WORLD · synchronized couples games
-- Run once in Supabase SQL Editor. Uses existing public.profiles(id, role).
create extension if not exists pgcrypto;

create table if not exists public.ayfar_games (
  id uuid primary key default gen_random_uuid(),
  game_key text not null check (game_key in ('who','thisorthat','qa','truth','speed','xo','predict','difference','compatibility','twenty','word','riddles')),
  status text not null default 'waiting' check (status in ('waiting','playing','finished','cancelled')),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ayfar_games_two_players check (guest_id is null or guest_id <> host_id)
);
create index if not exists ayfar_games_host_updated on public.ayfar_games(host_id, updated_at desc);
create index if not exists ayfar_games_guest_updated on public.ayfar_games(guest_id, updated_at desc);

alter table public.ayfar_games enable row level security;
drop policy if exists "participants read ayfar games" on public.ayfar_games;
create policy "participants read ayfar games" on public.ayfar_games
for select to authenticated using (auth.uid() = host_id or auth.uid() = guest_id);

create or replace function public.ayfar_game_create(p_game_key text, p_state jsonb default '{}'::jsonb)
returns public.ayfar_games
language plpgsql security definer set search_path = public, auth
as $$
declare v_user uuid := auth.uid(); v_role text; v_game public.ayfar_games;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل للعب'; end if;
 if p_game_key not in ('who','thisorthat','qa','truth','speed','xo','predict','difference','compatibility','twenty','word','riddles') then raise exception 'لعبة غير معروفة'; end if;
 insert into public.ayfar_games(game_key,host_id,state) values(p_game_key,v_user,coalesce(p_state,'{}'::jsonb)) returning * into v_game;
 return v_game;
end $$;

create or replace function public.ayfar_game_join(p_game_id uuid)
returns public.ayfar_games
language plpgsql security definer set search_path = public, auth
as $$
declare v_user uuid := auth.uid(); v_game public.ayfar_games; v_role text;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل للعب'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_game.host_id=v_user then return v_game; end if;
 if v_game.guest_id is not null and v_game.guest_id<>v_user then raise exception 'هذه المباراة ممتلئة'; end if;
 if v_game.status<>'waiting' then raise exception 'المباراة لم تعد متاحة للانضمام'; end if;
 update public.ayfar_games set guest_id=v_user,status='playing',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

create or replace function public.ayfar_game_update(p_game_id uuid,p_expected_version bigint,p_state jsonb,p_status text default null)
returns public.ayfar_games
language plpgsql security definer set search_path = public, auth
as $$
declare v_user uuid := auth.uid(); v_game public.ayfar_games;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user not in (v_game.host_id,v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.status in ('finished','cancelled') then raise exception 'انتهت هذه المباراة'; end if;
 if p_status is not null and p_status not in ('waiting','playing','finished','cancelled') then raise exception 'حالة غير صالحة'; end if;
 update public.ayfar_games set state=coalesce(p_state,'{}'::jsonb),status=coalesce(p_status,status),version=version+1,updated_at=now()
 where id=p_game_id returning * into v_game;
 return v_game;
end $$;

grant execute on function public.ayfar_game_create(text,jsonb) to authenticated;
grant execute on function public.ayfar_game_join(uuid) to authenticated;
grant execute on function public.ayfar_game_update(uuid,bigint,jsonb,text) to authenticated;
grant select on public.ayfar_games to authenticated;

do $$
begin
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_games') then
  alter publication supabase_realtime add table public.ayfar_games;
 end if;
exception when undefined_object then null;
end $$;
