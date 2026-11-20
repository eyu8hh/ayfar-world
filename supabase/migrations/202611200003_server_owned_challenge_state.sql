-- Build a server-owned initial game state. Client may suggest only a bounded round count,
-- question ordering metadata and a cosmetic variant; all gameplay/result fields are reset.
create or replace function public.ayfar_game_initial_state(p_game_key text, p_state jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_total integer;
  v_order jsonb := '{}'::jsonb;
  v_pair record;
  v_values jsonb;
begin
  v_total := case
    when coalesce(p_state->>'total','') ~ '^[0-9]{1,2}$'
      then least(20, greatest(1, (p_state->>'total')::integer))
    else case when p_game_key in ('thisorthat','predict','compatibility','riddles','flags','geography','mixed') then 10 else 5 end
  end;

  if jsonb_typeof(p_state->'questionOrder') = 'object' then
    for v_pair in select key, value from jsonb_each(p_state->'questionOrder') limit 30 loop
      if jsonb_typeof(v_pair.value) = 'array' then
        select coalesce(jsonb_agg((e.value)::integer order by e.ordinality), '[]'::jsonb)
          into v_values
        from jsonb_array_elements(v_pair.value) with ordinality e(value, ordinality)
        where e.ordinality <= 1000
          and jsonb_typeof(e.value) = 'number'
          and (e.value #>> '{}') ~ '^[0-9]{1,6}$'
          and (e.value #>> '{}')::integer <= 999999;
        v_order := v_order || jsonb_build_object(v_pair.key, v_values);
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'key', p_game_key,
    'phase', 'ready',
    'round', 0,
    'total', v_total,
    'scores', jsonb_build_object('ayoub',0,'farahati',0),
    'answers', jsonb_build_object(),
    'history', '[]'::jsonb,
    'turn', 'ayoub',
    'questionIndex', 0,
    'questionOrder', v_order,
    'scoredRound', 0,
    'found', '[]'::jsonb,
    'diffIndex', case when coalesce(p_state->>'diffIndex','') ~ '^[0-9]{1,2}$'
      then least(11,greatest(0,(p_state->>'diffIndex')::integer)) else 0 end
  );
end;
$$;

revoke all on function public.ayfar_game_initial_state(text,jsonb) from public, anon, authenticated;

create or replace function public.ayfar_challenge_send(p_game_key text, p_state jsonb default '{}'::jsonb)
returns public.ayfar_game_challenges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_target uuid;
  v_challenge public.ayfar_game_challenges;
begin
  if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  select lower(role) into v_role from public.profiles where id=v_user;
  if coalesce(v_role,'') not in ('ayoub','farhati','farahati') then
    raise exception 'الحساب غير مخوّل لإرسال التحديات';
  end if;
  if p_game_key not in ('who','thisorthat','qa','truth','speed','predict','compatibility','riddles','flags','geography','mixed') then
    raise exception 'لعبة غير معروفة';
  end if;
  if v_role='ayoub' then
    select id into v_target from public.profiles
      where lower(role) in ('farhati','farahati') and id<>v_user limit 1;
  else
    select id into v_target from public.profiles
      where lower(role)='ayoub' and id<>v_user limit 1;
  end if;
  if v_target is null then raise exception 'تعذر العثور على حساب الطرف الآخر'; end if;

  update public.ayfar_game_challenges set status='expired',updated_at=now()
    where status='pending' and created_at < now()-interval '30 minutes';
  if exists(select 1 from public.ayfar_game_challenges
    where status='pending' and (from_user in (v_user,v_target) or to_user in (v_user,v_target))) then
    raise exception 'يوجد تحدٍّ معلّق بالفعل بينكما.';
  end if;

  insert into public.ayfar_game_challenges(from_user,to_user,game_key,state)
    values(v_user,v_target,p_game_key,public.ayfar_game_initial_state(p_game_key,p_state))
    returning * into v_challenge;
  return v_challenge;
end;
$$;

create or replace function public.ayfar_challenge_accept(p_challenge_id uuid)
returns public.ayfar_games
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_challenge public.ayfar_game_challenges;
  v_game public.ayfar_games;
begin
  if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  select * into v_challenge from public.ayfar_game_challenges
    where id=p_challenge_id for update;
  if not found then raise exception 'هذا التحدي غير موجود'; end if;
  if v_challenge.to_user<>v_user then raise exception 'هذا التحدي ليس موجهاً إلى حسابك'; end if;
  if v_challenge.status<>'pending' then raise exception 'لم يعد هذا التحدي متاحاً'; end if;
  if v_challenge.created_at < now()-interval '30 minutes' then
    update public.ayfar_game_challenges set status='expired',updated_at=now()
      where id=p_challenge_id;
    return null;
  end if;

  insert into public.ayfar_games(game_key,host_id,guest_id,state,status)
    values(v_challenge.game_key,v_challenge.from_user,v_challenge.to_user,
      public.ayfar_game_initial_state(v_challenge.game_key,v_challenge.state),'playing')
    returning * into v_game;
  update public.ayfar_game_challenges set status='accepted',game_id=v_game.id,updated_at=now()
    where id=p_challenge_id;
  return v_game;
end;
$$;

revoke all on function public.ayfar_challenge_send(text,jsonb) from public, anon;
grant execute on function public.ayfar_challenge_send(text,jsonb) to authenticated;
revoke all on function public.ayfar_challenge_accept(uuid) from public, anon;
grant execute on function public.ayfar_challenge_accept(uuid) to authenticated;
