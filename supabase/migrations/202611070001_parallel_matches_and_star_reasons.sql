-- AYFAR WORLD · allow parallel unfinished matches and require a reason for every star change.
-- Additive migration. Apply this SQL in the Supabase SQL Editor after reviewing the matching app release.

alter table public.ayfar_star_history
  add column if not exists changed_by uuid references auth.users(id) on delete set null;

create or replace function public.change_ayfar_stars(p_delta bigint,p_reason text default null)
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare
  new_balance bigint;
  clean_reason text := trim(coalesce(p_reason,''));
begin
  if not exists(
    select 1 from public.profiles
    where id=auth.uid() and lower(role) in ('farhati','farhati')
  ) then
    raise exception 'فقط فرحتي تستطيع تغيير رصيد النجوم';
  end if;
  if p_delta is null or p_delta=0 then
    raise exception 'يجب أن يكون التغيير أكبر أو أقل من صفر';
  end if;
  if clean_reason='' then
    raise exception 'يرجى كتابة سبب إضافة أو خصم النجوم';
  end if;
  if char_length(clean_reason)>160 then
    raise exception 'يجب ألا يتجاوز السبب 160 حرفاً';
  end if;

  update public.ayfar_star_wallet
  set balance=balance+p_delta,updated_at=now()
  where id=1 and balance+p_delta>=0
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'الرصيد لا يسمح بهذا الخصم';
  end if;

  insert into public.ayfar_star_history(delta,balance_after,reason,changed_by)
  values(p_delta,new_balance,clean_reason,auth.uid());
  return new_balance;
end
$$;

grant execute on function public.change_ayfar_stars(bigint,text) to authenticated;

-- A running match no longer blocks the creation or acceptance of another match.
-- The existing pending-invitation uniqueness rules remain in place to avoid duplicate invitations.

create or replace function public.ayfar_challenge_send(p_game_key text,p_state jsonb default '{}'::jsonb)
returns public.ayfar_game_challenges
language plpgsql
security definer
set search_path=public,auth
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
    where lower(role) in ('farahati','farhati') and id<>v_user limit 1;
  else
    select id into v_target from public.profiles
    where lower(role)='ayoub' and id<>v_user limit 1;
  end if;
  if v_target is null then raise exception 'تعذر العثور على حساب الطرف الآخر'; end if;

  update public.ayfar_game_challenges
  set status='expired',updated_at=now()
  where status='pending' and created_at < now()-interval '30 minutes';

  if exists(
    select 1 from public.ayfar_game_challenges
    where status='pending'
      and (from_user in (v_user,v_target) or to_user in (v_user,v_target))
  ) then
    raise exception 'يوجد تحدٍّ معلّق بالفعل بينكما.';
  end if;

  insert into public.ayfar_game_challenges(from_user,to_user,game_key,state)
  values(v_user,v_target,p_game_key,coalesce(p_state,'{}'::jsonb))
  returning * into v_challenge;
  return v_challenge;
end
$$;

create or replace function public.ayfar_challenge_accept(p_challenge_id uuid)
returns public.ayfar_games
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_user uuid := auth.uid();
  v_challenge public.ayfar_game_challenges;
  v_game public.ayfar_games;
begin
  if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  select * into v_challenge
  from public.ayfar_game_challenges
  where id=p_challenge_id
  for update;

  if not found then raise exception 'هذا التحدي غير موجود'; end if;
  if v_challenge.to_user<>v_user then raise exception 'هذا التحدي ليس موجهاً إلى حسابك'; end if;
  if v_challenge.status<>'pending' then raise exception 'لم يعد هذا التحدي متاحاً'; end if;

  if v_challenge.created_at < now()-interval '30 minutes' then
    update public.ayfar_game_challenges
    set status='expired',updated_at=now()
    where id=p_challenge_id;
    return null;
  end if;

  insert into public.ayfar_games(game_key,host_id,guest_id,state,status)
  values(v_challenge.game_key,v_challenge.from_user,v_challenge.to_user,v_challenge.state,'playing')
  returning * into v_game;

  update public.ayfar_game_challenges
  set status='accepted',game_id=v_game.id,updated_at=now()
  where id=p_challenge_id;
  return v_game;
end
$$;

grant execute on function public.ayfar_challenge_send(text,jsonb) to authenticated;
grant execute on function public.ayfar_challenge_accept(uuid) to authenticated;
