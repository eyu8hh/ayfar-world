-- AYFAR WORLD · direct challenges between Ayoub and Farhati
-- Run once in Supabase SQL Editor after deploying this feature.

create table if not exists public.ayfar_game_challenges (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in ('who','thisorthat','qa','truth','speed','predict','compatibility','riddles','flags','geography','mixed')),
  state jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled','expired')),
  game_id uuid references public.ayfar_games(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ayfar_challenge_two_people check (from_user <> to_user)
);

create index if not exists ayfar_challenges_from_created on public.ayfar_game_challenges(from_user, created_at desc);
create index if not exists ayfar_challenges_to_created on public.ayfar_game_challenges(to_user, created_at desc);
create unique index if not exists ayfar_one_pending_challenge_from on public.ayfar_game_challenges(from_user) where status='pending';
create unique index if not exists ayfar_one_pending_challenge_to on public.ayfar_game_challenges(to_user) where status='pending';

alter table public.ayfar_game_challenges enable row level security;
drop policy if exists "participants read ayfar challenges" on public.ayfar_game_challenges;
create policy "participants read ayfar challenges" on public.ayfar_game_challenges
for select to authenticated using (auth.uid()=from_user or auth.uid()=to_user);

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
  if p_game_key not in ('who','thisorthat','qa','truth','speed','predict','compatibility','riddles','flags','geography','mixed') then raise exception 'لعبة غير معروفة'; end if;

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

create or replace function public.ayfar_challenge_accept(p_challenge_id uuid)
returns public.ayfar_games
language plpgsql security definer set search_path=public,auth
as $$
declare
  v_user uuid := auth.uid();
  v_challenge public.ayfar_game_challenges;
  v_game public.ayfar_games;
begin
  if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  select * into v_challenge from public.ayfar_game_challenges where id=p_challenge_id for update;
  if not found then raise exception 'هذا التحدي غير موجود'; end if;
  if v_challenge.to_user<>v_user then raise exception 'هذا التحدي ليس موجهاً إلى حسابك'; end if;
  if v_challenge.status<>'pending' then raise exception 'لم يعد هذا التحدي متاحاً'; end if;
  if v_challenge.created_at < now()-interval '30 minutes' then
    update public.ayfar_game_challenges set status='expired',updated_at=now() where id=p_challenge_id;
    raise exception 'انتهت صلاحية هذا التحدي. اطلب تحدياً جديداً.';
  end if;
  if exists(select 1 from public.ayfar_games where (host_id=v_user or guest_id=v_user) and status='playing' and coalesce(state->>'phase','') <> 'finished' and updated_at > now()-interval '3 hours') then
    raise exception 'لديك مباراة نشطة بالفعل. أنهها أولاً.';
  end if;

  insert into public.ayfar_games(game_key,host_id,guest_id,state,status)
  values(v_challenge.game_key,v_challenge.from_user,v_challenge.to_user,v_challenge.state,'playing')
  returning * into v_game;

  update public.ayfar_game_challenges set status='accepted',game_id=v_game.id,updated_at=now()
  where id=p_challenge_id;
  return v_game;
end;
$$;

create or replace function public.ayfar_challenge_reject(p_challenge_id uuid)
returns public.ayfar_game_challenges
language plpgsql security definer set search_path=public,auth
as $$
declare v_row public.ayfar_game_challenges;
begin
  update public.ayfar_game_challenges set status='rejected',updated_at=now()
  where id=p_challenge_id and to_user=auth.uid() and status='pending'
  returning * into v_row;
  if not found then raise exception 'تعذر رفض هذا التحدي؛ ربما لم يعد متاحاً'; end if;
  return v_row;
end;
$$;

create or replace function public.ayfar_challenge_cancel(p_challenge_id uuid)
returns public.ayfar_game_challenges
language plpgsql security definer set search_path=public,auth
as $$
declare v_row public.ayfar_game_challenges;
begin
  update public.ayfar_game_challenges set status='cancelled',updated_at=now()
  where id=p_challenge_id and from_user=auth.uid() and status='pending'
  returning * into v_row;
  if not found then raise exception 'تعذر إلغاء هذا التحدي؛ ربما تم قبوله بالفعل'; end if;
  return v_row;
end;
$$;

grant select on public.ayfar_game_challenges to authenticated;
grant execute on function public.ayfar_challenge_send(text,jsonb) to authenticated;
grant execute on function public.ayfar_challenge_accept(uuid) to authenticated;
grant execute on function public.ayfar_challenge_reject(uuid) to authenticated;
grant execute on function public.ayfar_challenge_cancel(uuid) to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_game_challenges') then
    alter publication supabase_realtime add table public.ayfar_game_challenges;
  end if;
exception when undefined_object then null;
end $$;
