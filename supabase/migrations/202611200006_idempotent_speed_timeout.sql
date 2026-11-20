-- Make speed timeout scoring idempotent if both answers were already scored.
create or replace function public.ayfar_game_bank_timeout(p_game_id uuid,p_expected_version bigint)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_round integer; v_index integer; v_count integer; v_q ayfar_private.game_question_bank; v_answers jsonb; v_scores jsonb; v_expected text;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.game_key<>'speed' or v_game.state->>'phase'<>'play' then raise exception 'لا ينطبق انتهاء الوقت على هذه المباراة'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت حالة المؤقت؛ حدّث المباراة'; end if;
 if coalesce((v_game.state->>'deadlineAt')::numeric,0)>extract(epoch from clock_timestamp())*1000 then raise exception 'ما زال وقت الإجابة متاحاً'; end if;
 v_round:=coalesce((v_game.state->>'round')::integer,1);
  if coalesce((v_game.state->>'scoredRound')::integer,0)=v_round and v_game.state->'bankResult' is not null and v_game.state->'bankResult'<>'null'::jsonb then return v_game; end if;
 v_answers:=coalesce(v_game.state->'answers','{}'::jsonb);
 if not (v_answers ? 'ayoub') then v_answers:=v_answers||jsonb_build_object('ayoub','[انتهى الوقت]'); end if;
 if not (v_answers ? 'farahati') then v_answers:=v_answers||jsonb_build_object('farahati','[انتهى الوقت]'); end if;
 select count(*) into v_count from ayfar_private.game_question_bank where game_key='speed';
 v_index:=(v_round-1)%v_count;
 if jsonb_typeof(v_game.state->'questionOrder'->'speed')='array' and jsonb_array_length(v_game.state->'questionOrder'->'speed')>0 then v_index:=((v_game.state->'questionOrder'->'speed')->>((v_round-1)%jsonb_array_length(v_game.state->'questionOrder'->'speed')))::integer; end if;
 select * into v_q from ayfar_private.game_question_bank where game_key='speed' and question_index=v_index;
 v_expected:=v_q.options->>v_q.correct_answer;
 v_scores:=coalesce(v_game.state->'scores','{"ayoub":0,"farahati":0}'::jsonb);
 v_scores:=jsonb_build_object('ayoub',coalesce((v_scores->>'ayoub')::integer,0)+case when v_answers->>'ayoub'=v_expected then 1 else 0 end,'farahati',coalesce((v_scores->>'farahati')::integer,0)+case when v_answers->>'farahati'=v_expected then 1 else 0 end);
 update public.ayfar_games set state=state||jsonb_build_object('answers',v_answers,'scores',v_scores,'bankResult',jsonb_build_object('correctAnswer',v_expected,'explanation',v_q.explanation,'ayoub',jsonb_build_object('correct',v_answers->>'ayoub'=v_expected,'points',case when v_answers->>'ayoub'=v_expected then 1 else 0 end),'farahati',jsonb_build_object('correct',v_answers->>'farahati'=v_expected,'points',case when v_answers->>'farahati'=v_expected then 1 else 0 end)),'scoredRound',v_round,'speedExpiredRound',v_round),version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

