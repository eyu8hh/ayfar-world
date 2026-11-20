-- Extend the private answer-key bank to the flags game.
alter table ayfar_private.game_question_bank drop constraint if exists game_question_bank_game_key_check;
alter table ayfar_private.game_question_bank add constraint game_question_bank_game_key_check check (game_key in ('mixed','speed','riddles','geography','flags'));
insert into ayfar_private.game_question_bank(game_key,question_index,question_id,category,difficulty,question,options,correct_answer,explanation)
values
('flags',0,10000,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["المغرب","تونس","الجزائر","تركيا"]'::jsonb,0,''),
('flags',1,10001,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الصين","اليابان","كوريا الجنوبية","تايلاند"]'::jsonb,1,''),
('flags',2,10002,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الأرجنتين","البرتغال","البرازيل","كولومبيا"]'::jsonb,2,''),
('flags',3,10003,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الولايات المتحدة","كندا","أستراليا","النرويج"]'::jsonb,1,''),
('flags',4,10004,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["تركيا","تونس","أذربيجان","باكستان"]'::jsonb,0,''),
('flags',5,10005,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["كينيا","نيجيريا","جنوب أفريقيا","غانا"]'::jsonb,2,''),
('flags',6,10006,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["بلجيكا","ألمانيا","النمسا","سويسرا"]'::jsonb,1,''),
('flags',7,10007,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["فنلندا","الدنمارك","السويد","آيسلندا"]'::jsonb,2,''),
('flags',8,10008,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["كوريا الشمالية","اليابان","الصين","كوريا الجنوبية"]'::jsonb,3,''),
('flags',9,10009,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الأوروغواي","الأرجنتين","تشيلي","باراغواي"]'::jsonb,1,''),
('flags',10,10010,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["فرنسا","هولندا","روسيا","إيطاليا"]'::jsonb,0,''),
('flags',11,10011,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["المكسيك","إيطاليا","المجر","إسبانيا"]'::jsonb,1,''),
('flags',12,10012,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["إسبانيا","البرتغال","فرنسا","رومانيا"]'::jsonb,0,''),
('flags',13,10013,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["إسبانيا","البرازيل","البرتغال","إيطاليا"]'::jsonb,2,''),
('flags',14,10014,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["لوكسمبورغ","هولندا","بلجيكا","فرنسا"]'::jsonb,1,''),
('flags',15,10015,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["ألمانيا","بلجيكا","هولندا","سويسرا"]'::jsonb,1,''),
('flags',16,10016,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["النمسا","السويد","سويسرا","الدنمارك"]'::jsonb,2,''),
('flags',17,10017,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["فنلندا","آيسلندا","النرويج","السويد"]'::jsonb,2,''),
('flags',18,10018,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الدنمارك","ألمانيا","هولندا","النرويج"]'::jsonb,0,''),
('flags',19,10019,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["السويد","فنلندا","إستونيا","النرويج"]'::jsonb,1,''),
('flags',20,10020,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["آيسلندا","إيرلندا","النرويج","فنلندا"]'::jsonb,0,''),
('flags',21,10021,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["التشيك","أوكرانيا","بولندا","سلوفاكيا"]'::jsonb,2,''),
('flags',22,10022,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["قبرص","اليونان","إيطاليا","تركيا"]'::jsonb,1,''),
('flags',23,10023,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["روسيا","صربيا","بلغاريا","سلوفاكيا"]'::jsonb,0,''),
('flags',24,10024,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["بيلاروسيا","أوكرانيا","بولندا","مولدوفا"]'::jsonb,1,''),
('flags',25,10025,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["مصر","العراق","الأردن","السودان"]'::jsonb,0,''),
('flags',26,10026,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الجزائر","ليبيا","تونس","المغرب"]'::jsonb,2,''),
('flags',27,10027,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["مالي","السنغال","غانا","الكاميرون"]'::jsonb,1,''),
('flags',28,10028,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["غانا","كينيا","نيجيريا","أوغندا"]'::jsonb,2,''),
('flags',29,10029,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["تنزانيا","إثيوبيا","كينيا","أوغندا"]'::jsonb,2,''),
('flags',30,10030,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["نيوزيلندا","أستراليا","فيجي","كندا"]'::jsonb,1,''),
('flags',31,10031,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["أستراليا","نيوزيلندا","ساموا","فيجي"]'::jsonb,1,''),
('flags',32,10032,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["الهند","باكستان","بنغلاديش","نيبال"]'::jsonb,0,''),
('flags',33,10033,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["إيران","أفغانستان","باكستان","الهند"]'::jsonb,2,''),
('flags',34,10034,'أعلام الدول','متوسط','ما الدولة التي ينتمي إليها هذا العلم؟','["ماليزيا","سنغافورة","الفلبين","إندونيسيا"]'::jsonb,3,'')
on conflict(game_key,question_index) do update set question_id=excluded.question_id,category=excluded.category,difficulty=excluded.difficulty,question=excluded.question,options=excluded.options,correct_answer=excluded.correct_answer,explanation=excluded.explanation;
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
 if v_game.game_key not in ('mixed','speed','riddles','geography','flags') or v_game.state->>'phase'<>'play' then raise exception 'المباراة ليست في مرحلة الإجابة'; end if;
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
 if v_game.game_key not in ('mixed','speed','riddles','geography','flags') or v_game.state->>'phase'<>'play' then raise exception 'لا يمكن الانتقال الآن'; end if;
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
 if v_game.game_key in ('mixed','speed','riddles','geography','flags') then
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
grant execute on function public.ayfar_game_bank_start(uuid,bigint) to authenticated;
grant execute on function public.ayfar_game_bank_answer(uuid,bigint,text) to authenticated;
grant execute on function public.ayfar_game_bank_next(uuid,bigint) to authenticated;
