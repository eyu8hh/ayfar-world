-- AYFAR WORLD · private secrets for Twenty Questions and Word Guess
-- Run once in Supabase SQL Editor after ayfar-games.sql.
create table if not exists public.ayfar_game_secrets (
  game_id uuid primary key references public.ayfar_games(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  secret text not null check (length(trim(secret)) between 1 and 200),
  created_at timestamptz not null default now()
);
alter table public.ayfar_game_secrets enable row level security;
drop policy if exists "secret owner can read" on public.ayfar_game_secrets;
create policy "secret owner can read" on public.ayfar_game_secrets
for select to authenticated using (auth.uid() = owner_id);
revoke all on public.ayfar_game_secrets from anon, authenticated;
grant select on public.ayfar_game_secrets to authenticated;

create or replace function public.ayfar_game_set_secret(
 p_game_id uuid, p_expected_version bigint, p_secret text
) returns public.ayfar_games
language plpgsql security definer set search_path=public,auth
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_role text;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found or v_user not in (v_game.host_id,v_game.guest_id) then raise exception 'المباراة غير موجودة أو لست مشاركاً فيها'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.game_key not in ('twenty','word') then raise exception 'هذه اللعبة لا تستخدم كلمة سرية'; end if;
 if v_game.status<>'playing' then raise exception 'المباراة ليست قيد اللعب'; end if;
 if coalesce(v_game.state->>'owner','')<>'' then raise exception 'تم تثبيت الكلمة السرية بالفعل'; end if;
 if (v_game.game_key='twenty' and v_user<>case when v_game.host_id=v_user then v_game.host_id else v_game.guest_id end) then raise exception 'الدور غير صالح'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل'; end if;
 if length(trim(coalesce(p_secret,''))) not between 1 and 200 then raise exception 'الكلمة السرية مطلوبة (حتى 200 حرف)'; end if;
 insert into public.ayfar_game_secrets(game_id,owner_id,secret) values(p_game_id,v_user,trim(p_secret));
 update public.ayfar_games set
   state=jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{owner}',to_jsonb(case when v_role='farahati' then 'farhati' else v_role end)), '{turn}',to_jsonb(case when game_key='twenty' then case when v_role='ayoub' then 'farhati' else 'ayoub' end else case when v_role='farahati' then 'farhati' else v_role end end)),
   version=version+1,updated_at=now()
 where id=p_game_id returning * into v_game;
 return v_game;
end $$;

create or replace function public.ayfar_game_guess_secret(
 p_game_id uuid, p_expected_version bigint, p_guess text
) returns jsonb
language plpgsql security definer set search_path=public,auth
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_secret public.ayfar_game_secrets; v_role text; v_guess text; v_correct boolean;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found or v_user not in (v_game.host_id,v_game.guest_id) then raise exception 'المباراة غير موجودة أو لست مشاركاً فيها'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.game_key not in ('twenty','word') or v_game.status<>'playing' then raise exception 'حالة اللعبة غير صالحة'; end if;
 select * into v_secret from public.ayfar_game_secrets where game_id=p_game_id;
 if not found then raise exception 'لم يتم تثبيت الكلمة السرية بعد'; end if;
 if v_user=v_secret.owner_id then raise exception 'صاحب الكلمة لا يمكنه تخمينها'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role not in ('ayoub','farhati','farahati') then raise exception 'الحساب غير مخوّل'; end if;
 if length(trim(coalesce(p_guess,''))) not between 1 and 200 then raise exception 'اكتب تخميناً صالحاً'; end if;
 v_guess:=lower(trim(p_guess));
 v_correct:=v_guess=lower(trim(v_secret.secret));
 if v_correct then
   update public.ayfar_games set
     state=jsonb_set(
       jsonb_set(
         jsonb_set(coalesce(state,'{}'::jsonb),'{scores}',jsonb_set(coalesce(state->'scores','{"ayoub":0,"farhati":0}'::jsonb),case when v_role in ('farhati','farahati') then '{farhati}' else '{ayoub}' end,
           to_jsonb(coalesce((state->'scores'->>case when v_role in ('farhati','farahati') then 'farhati' else 'ayoub' end)::int,0)+case when game_key='word' then 2 else 3 end))),
         '{round}',to_jsonb(coalesce((state->>'round')::int,1)+1)),
       '{owner}', 'null'::jsonb),
     version=version+1,updated_at=now()
   where id=p_game_id returning * into v_game;
   update public.ayfar_game_secrets set secret='__cleared__',owner_id=v_user where game_id=p_game_id;
 else
   update public.ayfar_games set version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 end if;
 return jsonb_build_object('correct',v_correct,'game',to_jsonb(v_game));
end $$;

grant execute on function public.ayfar_game_set_secret(uuid,bigint,text) to authenticated;
grant execute on function public.ayfar_game_guess_secret(uuid,bigint,text) to authenticated;
