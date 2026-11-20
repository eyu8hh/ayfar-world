-- AYFAR: private answer keys and authoritative scoring for bank-backed games.
create schema if not exists ayfar_private;
revoke all on schema ayfar_private from public, anon, authenticated;
create table if not exists ayfar_private.game_question_bank (
 game_key text not null check (game_key in ('mixed','speed','riddles','geography')),
 question_index integer not null check (question_index>=0),
 question_id integer not null,
 category text not null,
 difficulty text not null,
 question text not null,
 options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
 correct_answer smallint not null check (correct_answer between 0 and 3),
 explanation text not null default '',
 primary key(game_key,question_index)
);
revoke all on ayfar_private.game_question_bank from public, anon, authenticated;
-- Answer rows are provisioned directly into the private Supabase schema; never commit keys to this public repository.

create or replace function public.ayfar_game_bank_start(p_game_id uuid,p_expected_version bigint)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_deadline timestamptz;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.game_key not in ('mixed','speed','riddles','geography') then raise exception 'هذه اللعبة لا تستخدم هذا المسار'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.state->>'phase'<>'ready' then raise exception 'لا يمكن بدء هذه المباراة الآن'; end if;
 if v_game.guest_id is null then raise exception 'بانتظار انضمام الطرف الآخر'; end if;
 if v_game.game_key='speed' then v_deadline:=clock_timestamp()+interval '15 seconds'; end if;
 update public.ayfar_games set state=state||jsonb_build_object('phase','play','round',1,'answers','{}'::jsonb,'deadlineAt',case when v_deadline is null then null else floor(extract(epoch from v_deadline)*1000)::bigint end),status='playing',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

create or replace function public.ayfar_game_bank_answer(p_game_id uuid,p_expected_version bigint,p_answer text)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid:=auth.uid(); v_role text; v_game public.ayfar_games; v_round integer; v_index integer; v_count integer;
 v_q ayfar_private.game_question_bank; v_answers jsonb; v_expected text; v_scores jsonb; v_result jsonb; v_points integer;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role='farhati' then v_role:='farahati'; end if;
 if v_role not in ('ayoub','farahati') then raise exception 'دور الحساب غير صالح'; end if;
 if v_game.game_key not in ('mixed','speed','riddles','geography') or v_game.state->>'phase'<>'play' then raise exception 'المباراة ليست في مرحلة الإجابة'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت الجولة؛ حدّث الحالة ثم أعد المحاولة'; end if;
 if coalesce(v_game.state->'answers'->>v_role,'')<>'' then raise exception 'لقد ثبّت إجابتك بالفعل'; end if;
 if v_game.game_key='speed' and coalesce((v_game.state->>'deadlineAt')::numeric,0)<=(extract(epoch from clock_timestamp())*1000) then raise exception 'انتهى وقت الإجابة'; end if;
 v_round:=greatest(1,coalesce((v_game.state->>'round')::integer,1));
 select count(*) into v_count from ayfar_private.game_question_bank where game_key=v_game.game_key;
 if v_count=0 then raise exception 'بنك الأسئلة غير متاح'; end if;
 v_index:=(v_round-1)%v_count;
 if jsonb_typeof(v_game.state->'questionOrder'->v_game.game_key)='array' and jsonb_array_length(v_game.state->'questionOrder'->v_game.game_key)>0 then
  v_index:=((v_game.state->'questionOrder'->v_game.game_key)->>((v_round-1)%jsonb_array_length(v_game.state->'questionOrder'->v_game.game_key)))::integer;
 end if;
 select * into v_q from ayfar_private.game_question_bank where game_key=v_game.game_key and question_index=v_index;
 if not found then raise exception 'السؤال الحالي غير صالح'; end if;
 if not exists(select 1 from jsonb_array_elements_text(v_q.options) o(value) where o.value=p_answer) then raise exception 'الاختيار غير موجود ضمن إجابات السؤال'; end if;
 v_answers:=coalesce(v_game.state->'answers','{}'::jsonb)||jsonb_build_object(v_role,p_answer);
 v_scores:=coalesce(v_game.state->'scores','{"ayoub":0,"farahati":0}'::jsonb);
 v_result:=null;
 if v_answers ? 'ayoub' and v_answers ? 'farahati' then
  v_expected:=v_q.options->>v_q.correct_answer;
  v_points:=case when v_game.game_key='speed' then 1 else 2 end;
  v_scores:=jsonb_build_object('ayoub',coalesce((v_scores->>'ayoub')::integer,0)+case when v_answers->>'ayoub'=v_expected then v_points else 0 end,'farahati',coalesce((v_scores->>'farahati')::integer,0)+case when v_answers->>'farahati'=v_expected then v_points else 0 end);
  v_result:=jsonb_build_object('correctAnswer',v_expected,'explanation',v_q.explanation,'ayoub',jsonb_build_object('correct',v_answers->>'ayoub'=v_expected,'points',case when v_answers->>'ayoub'=v_expected then v_points else 0 end),'farahati',jsonb_build_object('correct',v_answers->>'farahati'=v_expected,'points',case when v_answers->>'farahati'=v_expected then v_points else 0 end));
 end if;
 update public.ayfar_games set state=state||jsonb_build_object('answers',v_answers,'scores',v_scores,'bankResult',v_result,'scoredRound',case when v_result is null then coalesce((state->>'scoredRound')::integer,0) else v_round end),version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

create or replace function public.ayfar_game_bank_next(p_game_id uuid,p_expected_version bigint)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_round integer; v_deadline timestamptz;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.game_key not in ('mixed','speed','riddles','geography') or v_game.state->>'phase'<>'play' then raise exception 'لا يمكن الانتقال الآن'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة؛ حدّث الحالة'; end if;
 if not (coalesce(v_game.state->'answers','{}'::jsonb) ? 'ayoub' and coalesce(v_game.state->'answers','{}'::jsonb) ? 'farahati') then raise exception 'ننتظر إجابة الطرفين'; end if;
 v_round:=coalesce((v_game.state->>'round')::integer,1)+1;
 if v_round>coalesce((v_game.state->>'total')::integer,10) then
  update public.ayfar_games set state=state||jsonb_build_object('round',v_round,'phase','finished'),status='finished',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 else
  if v_game.game_key='speed' then v_deadline:=clock_timestamp()+interval '15 seconds'; end if;
  update public.ayfar_games set state=state||jsonb_build_object('round',v_round,'phase','play','answers','{}'::jsonb,'bankResult',null,'deadlineAt',case when v_deadline is null then null else floor(extract(epoch from v_deadline)*1000)::bigint end),version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 end if;
 return v_game;
end $$;

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

create or replace function public.ayfar_game_update(p_game_id uuid,p_expected_version bigint,p_state jsonb,p_status text default null)
returns public.ayfar_games language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_next jsonb;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.status in ('finished','cancelled') then raise exception 'انتهت هذه المباراة'; end if;
 if v_game.game_key in ('mixed','speed','riddles','geography') then
  v_next:=(coalesce(p_state,'{}'::jsonb)-array['phase','round','total','scores','answers','questionOrder','turn','deadlineAt','bankResult','scoredRound','speedExpiredRound']) ||
    (v_game.state-array['chatMessages','chatReadAt','chatTyping','lastChatAt','chatReactions']);
  update public.ayfar_games set state=v_next,version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 else
  update public.ayfar_games set state=coalesce(p_state,'{}'::jsonb),status=coalesce(p_status,status),version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 end if;
 return v_game;
end $$;

revoke all on function public.ayfar_game_bank_start(uuid,bigint) from public,anon;
revoke all on function public.ayfar_game_bank_answer(uuid,bigint,text) from public,anon;
revoke all on function public.ayfar_game_bank_next(uuid,bigint) from public,anon;
revoke all on function public.ayfar_game_bank_timeout(uuid,bigint) from public,anon;
grant execute on function public.ayfar_game_bank_start(uuid,bigint) to authenticated;
grant execute on function public.ayfar_game_bank_answer(uuid,bigint,text) to authenticated;
grant execute on function public.ayfar_game_bank_next(uuid,bigint) to authenticated;
grant execute on function public.ayfar_game_bank_timeout(uuid,bigint) to authenticated;
revoke all on function public.ayfar_game_update(uuid,bigint,jsonb,text) from public,anon;
grant execute on function public.ayfar_game_update(uuid,bigint,jsonb,text) to authenticated;
