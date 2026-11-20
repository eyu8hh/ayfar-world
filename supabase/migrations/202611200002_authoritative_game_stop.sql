-- AYFAR WORLD · authoritative early-stop action
-- This is an additive action endpoint. Existing match rows and gameplay state are preserved.
create or replace function public.ayfar_game_stop(
  p_game_id uuid,
  p_expected_version bigint
)
returns public.ayfar_games
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_game public.ayfar_games;
begin
  if v_user is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;

  select lower(p.role) into v_role
  from public.profiles p
  where p.id = v_user;

  if v_role = 'farhati' then v_role := 'farahati'; end if;
  if v_role not in ('ayoub', 'farahati') then
    raise exception 'الحساب غير مخوّل لإيقاف المباراة';
  end if;

  select * into v_game
  from public.ayfar_games g
  where g.id = p_game_id
  for update;

  if not found then raise exception 'المباراة غير موجودة'; end if;
  if v_user not in (v_game.host_id, v_game.guest_id) then
    raise exception 'لست مشاركاً في هذه المباراة';
  end if;
  if v_game.version <> p_expected_version then
    raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً';
  end if;
  if v_game.status in ('finished', 'cancelled') then
    raise exception 'هذه المباراة متوقفة بالفعل';
  end if;

  update public.ayfar_games
  set state = coalesce(state, '{}'::jsonb) || jsonb_build_object(
        'phase', 'finished',
        'endedEarly', true,
        'stoppedBy', v_role,
        'stoppedAt', clock_timestamp()
      ),
      status = 'cancelled',
      version = version + 1,
      updated_at = clock_timestamp()
  where id = p_game_id
  returning * into v_game;

  return v_game;
end;
$$;

revoke all on function public.ayfar_game_stop(uuid, bigint) from public, anon;
grant execute on function public.ayfar_game_stop(uuid, bigint) to authenticated;
