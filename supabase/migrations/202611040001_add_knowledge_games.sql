-- AYFAR WORLD: allow synchronized knowledge games on existing Supabase projects.
alter table public.ayfar_games drop constraint if exists ayfar_games_game_key_check;
alter table public.ayfar_games add constraint ayfar_games_game_key_check
check (game_key in ('who','thisorthat','qa','truth','speed','xo','predict','difference','compatibility','twenty','word','riddles','guess','flags','geography'));

create or replace function public.ayfar_game_create(p_game_key text, p_state jsonb default '{}'::jsonb)
returns public.ayfar_games
language plpgsql security definer set search_path = public, auth
as $$
declare v_user uuid := auth.uid(); v_role text; v_game public.ayfar_games;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل للعب'; end if;
 if p_game_key not in ('who','thisorthat','qa','truth','speed','xo','predict','difference','compatibility','twenty','word','riddles','guess','flags','geography') then raise exception 'لعبة غير معروفة'; end if;
 insert into public.ayfar_games(game_key,host_id,state) values(p_game_key,v_user,coalesce(p_state,'{}'::jsonb)) returning * into v_game;
 return v_game;
end $$;
grant execute on function public.ayfar_game_create(text,jsonb) to authenticated;
