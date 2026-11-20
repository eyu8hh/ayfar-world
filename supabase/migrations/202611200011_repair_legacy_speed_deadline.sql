-- Repair legacy in-progress speed rooms that predate server-owned deadlines.
create or replace function public.ayfar_game_bank_start(p_game_id uuid,p_expected_version bigint)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_deadline timestamptz;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.game_key not in ('mixed','speed','riddles','geography','flags') then raise exception 'هذه اللعبة لا تستخدم هذا المسار'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.state->>'phase'='play' then
  if v_game.game_key='speed' and coalesce((v_game.state->>'deadlineAt')::numeric,0)<=0 then
   v_deadline:=clock_timestamp()+interval '15 seconds';
   update public.ayfar_games set state=state||jsonb_build_object('deadlineAt',floor(extract(epoch from v_deadline)*1000)::bigint),version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
  end if;
  return v_game;
 end if;
 if v_game.state->>'phase'<>'ready' then raise exception 'لا يمكن بدء هذه المباراة الآن'; end if;
 if v_game.guest_id is null then raise exception 'بانتظار انضمام الطرف الآخر'; end if;
 if v_game.game_key='speed' then v_deadline:=clock_timestamp()+interval '15 seconds'; end if;
 update public.ayfar_games set state=state||jsonb_build_object('phase','play','round',1,'scores',jsonb_build_object('ayoub',0,'farahati',0),'answers','{}'::jsonb,'bankResult',null,'scoredRound',0,'speedExpiredRound',0,'deadlineAt',case when v_deadline is null then null else floor(extract(epoch from v_deadline)*1000)::bigint end),status='playing',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

revoke all on function public.ayfar_game_bank_start(uuid,bigint) from public,anon;
grant execute on function public.ayfar_game_bank_start(uuid,bigint) to authenticated;
