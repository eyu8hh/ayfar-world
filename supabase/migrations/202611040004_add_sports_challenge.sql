-- AYFAR WORLD · add the standalone sports challenge.
-- Run once in the Supabase SQL Editor after deploying this update.

alter table public.ayfar_games drop constraint if exists ayfar_games_game_key_check;
alter table public.ayfar_games add constraint ayfar_games_game_key_check
check (game_key in ('who','thisorthat','qa','truth','speed','xo','predict','difference','compatibility','twenty','word','riddles','guess','flags','geography','mixed','sports'));

alter table public.ayfar_game_challenges drop constraint if exists ayfar_game_challenges_game_key_check;
alter table public.ayfar_game_challenges add constraint ayfar_game_challenges_game_key_check
check (game_key in ('who','thisorthat','qa','truth','speed','predict','compatibility','riddles','flags','geography','mixed','sports'));

create or replace function public.ayfar_game_create(p_game_key text, p_state jsonb default '{}'::jsonb)
returns public.ayfar_games
language plpgsql security definer set search_path = public, auth
as $$
declare v_user uuid := auth.uid(); v_role text; v_game public.ayfar_games;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل للعب'; end if;
 if p_game_key not in ('who','thisorthat','qa','truth','speed','xo','predict','difference','compatibility','twenty','word','riddles','guess','flags','geography','mixed','sports') then raise exception 'لعبة غير معروفة'; end if;
 insert into public.ayfar_games(game_key,host_id,state) values(p_game_key,v_user,coalesce(p_state,'{}'::jsonb)) returning * into v_game;
 return v_game;
end $$;
grant execute on function public.ayfar_game_create(text,jsonb) to authenticated;

create or replace function public.ayfar_challenge_send(p_game_key text,p_state jsonb default '{}'::jsonb)
returns public.ayfar_game_challenges
language plpgsql security definer set search_path=public,auth
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_target uuid;
  v_challenge public.ayfar_game_challenges;
begin
  if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  select lower(role) into v_role from public.profiles where id=v_user;
  if coalesce(v_role,'') not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل لإرسال التحديات'; end if;
  if p_game_key not in ('who','thisorthat','qa','truth','speed','predict','compatibility','riddles','flags','geography','mixed','sports') then raise exception 'لعبة غير معروفة'; end if;

  if v_role='ayoub' then
    select id into v_target from public.profiles where lower(role) in ('farhati','farahati') and id<>v_user limit 1;
  else
    select id into v_target from public.profiles where lower(role)='ayoub' and id<>v_user limit 1;
  end if;
  if v_target is null then raise exception 'تعذر العثور على حساب الطرف الآخر'; end if;

  update public.ayfar_game_challenges set status='expired',updated_at=now()
  where status='pending' and created_at < now()-interval '30 minutes';

  if exists(select 1 from public.ayfar_games where (host_id in (v_user,v_target) or guest_id in (v_user,v_target)) and status='playing' and coalesce(state->>'phase','') <> 'finished' and updated_at > now()-interval '3 hours') then
    raise exception 'لديكما مباراة نشطة بالفعل. أنهيها أو عُد إليها أولاً.';
  end if;
  if exists(select 1 from public.ayfar_game_challenges where status='pending' and (from_user in (v_user,v_target) or to_user in (v_user,v_target))) then
    raise exception 'يوجد تحدٍّ معلّق بالفعل بينكما.';
  end if;

  insert into public.ayfar_game_challenges(from_user,to_user,game_key,state)
  values(v_user,v_target,p_game_key,coalesce(p_state,'{}'::jsonb))
  returning * into v_challenge;
  return v_challenge;
end;
$$;
