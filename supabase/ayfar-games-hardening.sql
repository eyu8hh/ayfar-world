-- AYFAR WORLD · enforce one Ayoub + one Farhati per match
-- Run this migration in Supabase SQL Editor after ayfar-games.sql.
create or replace function public.ayfar_game_join(p_game_id uuid)
returns public.ayfar_games
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_game public.ayfar_games;
  v_guest_role text;
  v_host_role text;
begin
  if v_user is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;

  select lower(role) into v_guest_role
  from public.profiles where id = v_user;

  if v_guest_role not in ('ayoub','farhati','farahati') then
    raise exception 'الحساب غير مخوّل للعب';
  end if;

  select * into v_game
  from public.ayfar_games
  where id = p_game_id
  for update;

  if not found then
    raise exception 'المباراة غير موجودة';
  end if;

  if v_game.host_id = v_user then
    return v_game;
  end if;

  if v_game.status <> 'waiting' then
    raise exception 'المباراة لم تعد متاحة للانضمام';
  end if;

  if v_game.guest_id is not null and v_game.guest_id <> v_user then
    raise exception 'هذه المباراة ممتلئة';
  end if;

  select lower(role) into v_host_role
  from public.profiles where id = v_game.host_id;

  if v_host_role is null then
    raise exception 'تعذر التحقق من صاحب المباراة';
  end if;

  if (v_host_role = 'ayoub' and v_guest_role not in ('farhati','farahati'))
     or (v_host_role in ('farhati','farahati') and v_guest_role <> 'ayoub') then
    raise exception 'يجب أن ينضم حساب الطرف الآخر، لا حساب بنفس الدور';
  end if;

  update public.ayfar_games
  set guest_id = v_user,
      status = 'playing',
      version = version + 1,
      updated_at = now()
  where id = p_game_id
  returning * into v_game;

  return v_game;
end;
$$;

grant execute on function public.ayfar_game_join(uuid) to authenticated;
