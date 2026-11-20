-- Do not allow a bank-backed round to advance before server scoring is committed.
create or replace function public.ayfar_game_bank_next(p_game_id uuid,p_expected_version bigint)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_round integer; v_deadline timestamptz;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.game_key not in ('mixed','speed','riddles','geography','flags') or v_game.state->>'phase'<>'play' then raise exception 'لا يمكن الانتقال الآن'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة؛ حدّث الحالة'; end if;
 if not (coalesce(v_game.state->'answers','{}'::jsonb) ? 'ayoub' and coalesce(v_game.state->'answers','{}'::jsonb) ? 'farahati') then raise exception 'ننتظر إجابة الطرفين'; end if;
 if coalesce((v_game.state->>'scoredRound')::integer,0)<>coalesce((v_game.state->>'round')::integer,1) or v_game.state->'bankResult' is null or v_game.state->'bankResult'='null'::jsonb then raise exception 'لم تُحتسب نتيجة الجولة على الخادم بعد'; end if;
 v_round:=coalesce((v_game.state->>'round')::integer,1)+1;
 if v_round>coalesce((v_game.state->>'total')::integer,10) then
  update public.ayfar_games set state=state||jsonb_build_object('round',v_round,'phase','finished'),status='finished',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 else
  if v_game.game_key='speed' then v_deadline:=clock_timestamp()+interval '15 seconds'; end if;
  update public.ayfar_games set state=state||jsonb_build_object('round',v_round,'phase','play','answers','{}'::jsonb,'bankResult',null,'deadlineAt',case when v_deadline is null then null else floor(extract(epoch from v_deadline)*1000)::bigint end),version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 end if;
 return v_game;
end $$;

