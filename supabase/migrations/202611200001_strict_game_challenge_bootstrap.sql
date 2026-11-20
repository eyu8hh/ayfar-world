-- AYFAR WORLD · P0.1 strict challenge bootstrap hardening
-- Additive RPC replacement. Does not alter existing match rows or table structure.
-- Apply only after reviewing the live schema and the client compatibility test results.

create or replace function public.ayfar_challenge_send(
  p_game_key text,
  p_state jsonb default '{}'::jsonb
)
returns public.ayfar_game_challenges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_target uuid;
  v_target_role text;
  v_target_count integer;
  v_challenge public.ayfar_game_challenges;
  v_safe_order jsonb := '{}'::jsonb;
  v_initial_state jsonb;
  v_total integer;
begin
  if v_user is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;

  select lower(p.role) into v_role
  from public.profiles p
  where p.id = v_user;

  if v_role = 'farhati' then
    v_role := 'farahati';
  end if;
  if v_role not in ('ayoub', 'farahati') then
    raise exception 'الحساب غير مخوّل لإرسال التحديات';
  end if;

  if p_game_key not in (
    'who','thisorthat','qa','truth','speed','predict',
    'compatibility','riddles','flags','geography','mixed'
  ) then
    raise exception 'لعبة غير معروفة';
  end if;

  if v_role = 'ayoub' then
    select count(*) into v_target_count
    from public.profiles p
    where lower(p.role) in ('farahati','farhati') and p.id <> v_user;
    select p.id into v_target
    from public.profiles p
    where lower(p.role) in ('farahati','farhati') and p.id <> v_user
    limit 1;
  else
    select count(*) into v_target_count
    from public.profiles p
    where lower(p.role) = 'ayoub' and p.id <> v_user;
    select p.id into v_target
    from public.profiles p
    where lower(p.role) = 'ayoub' and p.id <> v_user
    limit 1;
  end if;

  if v_target_count <> 1 or v_target is null then
    raise exception 'تعذر تحديد حساب الطرف الآخر بشكل آمن';
  end if;

  select lower(p.role) into v_target_role
  from public.profiles p
  where p.id = v_target;
  if v_target_role = 'farhati' then
    v_target_role := 'farahati';
  end if;
  if v_target_role = v_role or v_target_role not in ('ayoub','farahati') then
    raise exception 'يجب أن يكون التحدي بين أيوب وفرحتي فقط';
  end if;

  update public.ayfar_game_challenges c
  set status = 'expired', updated_at = now()
  where c.status = 'pending'
    and c.created_at < now() - interval '30 minutes';

  if exists (
    select 1 from public.ayfar_game_challenges c
    where c.status = 'pending'
      and (c.from_user in (v_user, v_target) or c.to_user in (v_user, v_target))
  ) then
    raise exception 'يوجد تحدٍّ معلّق بالفعل بينكما.';
  end if;

  -- Only the harmless question ordering hint is accepted from the browser.
  -- Scores, phase, round, answers, history, AI/local answer keys and extra
  -- client-authored fields are always initialized by the database.
  if jsonb_typeof(coalesce(p_state, '{}'::jsonb)->'questionOrder') = 'object' then
    v_safe_order := coalesce(p_state->'questionOrder', '{}'::jsonb);
  end if;

  v_total := case
    when p_game_key in ('thisorthat','predict','compatibility','riddles','flags','geography','mixed') then 10
    else 5
  end;

  v_initial_state := jsonb_build_object(
    'key', p_game_key,
    'phase', 'ready',
    'round', 0,
    'total', v_total,
    'scores', jsonb_build_object('ayoub', 0, 'farahati', 0),
    'answers', '{}'::jsonb,
    'history', '[]'::jsonb,
    'turn', 'ayoub',
    'questionIndex', 0,
    'questionOrder', v_safe_order,
    'scoredRound', 0,
    'found', '[]'::jsonb,
    'diffIndex', 0
  );

  insert into public.ayfar_game_challenges(from_user, to_user, game_key, state)
  values (v_user, v_target, p_game_key, v_initial_state)
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
  v_sender_role text;
  v_receiver_role text;
  v_game public.ayfar_games;
  v_initial_state jsonb;
begin
  if v_user is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;

  select * into v_challenge
  from public.ayfar_game_challenges c
  where c.id = p_challenge_id
  for update;

  if not found then
    raise exception 'هذا التحدي غير موجود';
  end if;
  if v_challenge.to_user <> v_user then
    raise exception 'هذا التحدي ليس موجهاً إلى حسابك';
  end if;
  if v_challenge.status <> 'pending' then
    raise exception 'لم يعد هذا التحدي متاحاً';
  end if;
  if v_challenge.created_at < now() - interval '30 minutes' then
    update public.ayfar_game_challenges
    set status = 'expired', updated_at = now()
    where id = p_challenge_id;
    return null;
  end if;

  select lower(p.role) into v_sender_role
  from public.profiles p where p.id = v_challenge.from_user;
  select lower(p.role) into v_receiver_role
  from public.profiles p where p.id = v_challenge.to_user;

  if v_sender_role = 'farhati' then v_sender_role := 'farahati'; end if;
  if v_receiver_role = 'farhati' then v_receiver_role := 'farahati'; end if;

  if not (
    (v_sender_role = 'ayoub' and v_receiver_role = 'farahati')
    or
    (v_sender_role = 'farahati' and v_receiver_role = 'ayoub')
  ) then
    raise exception 'تعذر التحقق من طرفي المباراة';
  end if;

  if v_challenge.game_key not in (
    'who','thisorthat','qa','truth','speed','predict',
    'compatibility','riddles','flags','geography','mixed'
  ) then
    raise exception 'نوع اللعبة غير مسموح';
  end if;

  -- Rebuild the initial state rather than trusting the stored challenge JSON.
  v_initial_state := jsonb_build_object(
    'key', v_challenge.game_key,
    'phase', 'ready',
    'round', 0,
    'total', case
      when v_challenge.game_key in ('thisorthat','predict','compatibility','riddles','flags','geography','mixed') then 10
      else 5
    end,
    'scores', jsonb_build_object('ayoub', 0, 'farahati', 0),
    'answers', '{}'::jsonb,
    'history', '[]'::jsonb,
    'turn', 'ayoub',
    'questionIndex', 0,
    'questionOrder', case
      when jsonb_typeof(v_challenge.state->'questionOrder') = 'object'
      then v_challenge.state->'questionOrder'
      else '{}'::jsonb
    end,
    'scoredRound', 0,
    'found', '[]'::jsonb,
    'diffIndex', 0
  );

  insert into public.ayfar_games(game_key, host_id, guest_id, state, status)
  values (
    v_challenge.game_key,
    v_challenge.from_user,
    v_challenge.to_user,
    v_initial_state,
    'playing'
  )
  returning * into v_game;

  update public.ayfar_game_challenges
  set status = 'accepted', game_id = v_game.id, updated_at = now()
  where id = p_challenge_id;

  return v_game;
end;
$$;

revoke all on function public.ayfar_challenge_send(text, jsonb) from public, anon;
revoke all on function public.ayfar_challenge_accept(uuid) from public, anon;
grant execute on function public.ayfar_challenge_send(text, jsonb) to authenticated;
grant execute on function public.ayfar_challenge_accept(uuid) to authenticated;
