-- Authoritative actions for the remaining non-bank couple games.
create or replace function public.ayfar_game_choice_valid(p_game_key text,p_question_index integer,p_answer text)
returns boolean
language plpgsql immutable set search_path=''
as $$
declare v_options text[];
begin
 if p_game_key='thisorthat' then
  v_options:=case p_question_index
   when 0 then array['البحر','الجبل']
   when 1 then array['القهوة','الشاي']
   when 2 then array['السهر','الاستيقاظ مبكراً']
   when 3 then array['السفر','البقاء في المنزل']
   when 4 then array['الأفلام','المسلسلات']
   when 5 then array['الصيف','الشتاء']
   when 6 then array['المكالمات','الرسائل']
   when 7 then array['المفاجآت','التخطيط']
   when 8 then array['الحلو','المالح']
   when 9 then array['مدينة','طبيعة']
   else null end;
 elsif p_game_key='compatibility' then
  v_options:=case p_question_index
   when 0 then array['وقت الصباح','وقت المساء']
   when 1 then array['البحر','الجبل']
   when 2 then array['رسالة','مكالمة']
   when 3 then array['فيلم','نزهة']
   when 4 then array['تخطيط','عفوية']
   when 5 then array['القهوة','الشاي']
   when 6 then array['السفر','الاستقرار']
   when 7 then array['الهدوء','الحركة']
   when 8 then array['المفاجآت','التخطيط المسبق']
   when 9 then array['المدينة','الطبيعة']
   else null end;
 else
  return false;
 end if;
 return p_answer=any(v_options);
end $$;

create or replace function public.ayfar_game_normalize_text(p_value text)
returns text
language sql immutable set search_path=''
as $$
 select lower(regexp_replace(translate(normalize(coalesce(p_value,''), NFKC),'أإآىة','ااايه'),'[ًٌٍَُِّْـٰـ]','','g'));
$$;

create or replace function public.ayfar_game_action(p_game_id uuid,p_expected_version bigint,p_action text,p_payload jsonb default '{}'::jsonb)
returns public.ayfar_games
language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid:=auth.uid(); v_role text; v_game public.ayfar_games;
 v_state jsonb; v_answers jsonb; v_scores jsonb; v_truth jsonb; v_guesses jsonb;
 v_submitted jsonb; v_judgments jsonb; v_round integer; v_index integer; v_order jsonb;
 v_predictor text; v_answer text; v_guess text; v_correct boolean; v_next_round integer;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 if jsonb_typeof(coalesce(p_payload,'{}'::jsonb))<>'object' then raise exception 'بيانات الحركة غير صالحة'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.status in ('finished','cancelled') then raise exception 'انتهت هذه المباراة'; end if;
 select lower(role) into v_role from public.profiles where id=v_user;
 if v_role='farhati' then v_role:='farahati'; end if;
 if v_role not in ('ayoub','farahati') then raise exception 'دور الحساب غير صالح'; end if;
 v_state:=coalesce(v_game.state,'{}'::jsonb);
 v_round:=greatest(1,coalesce((v_state->>'round')::integer,1));
 v_answers:=coalesce(v_state->'answers','{}'::jsonb);
 v_scores:=coalesce(v_state->'scores','{"ayoub":0,"farahati":0}'::jsonb);
 v_truth:=coalesce(v_state->'truthAnswers','{}'::jsonb);
 v_guesses:=coalesce(v_state->'guesses','{}'::jsonb);
 v_submitted:=coalesce(v_state->'whoSubmitted','{}'::jsonb);
 v_judgments:=coalesce(v_state->'whoJudgments','{}'::jsonb);

 if p_action='start' then
  if v_game.game_key not in ('who','thisorthat','qa','truth','predict','compatibility') then raise exception 'هذه اللعبة تستخدم مسار بدء آخر'; end if;
  if v_state->>'phase'='play' then return v_game; end if;
  if v_state->>'phase'<>'ready' or v_game.guest_id is null then raise exception 'المباراة غير جاهزة للبدء'; end if;
  v_state:=v_state||jsonb_build_object('phase','play','round',1,'scores',jsonb_build_object('ayoub',0,'farahati',0),'answers','{}'::jsonb,'scoredRound',0,'turn','ayoub');
  update public.ayfar_games set state=v_state,status='playing',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
  return v_game;

 elsif p_action='answer' then
  if v_game.game_key not in ('qa','truth','thisorthat','compatibility') or v_state->>'phase'<>'play' then raise exception 'لا يمكن إرسال إجابة في هذه المرحلة'; end if;
  if v_answers ? v_role then raise exception 'لقد أرسلت إجابتك بالفعل'; end if;
  v_answer:=btrim(coalesce(p_payload->>'answer',''));
  if v_answer='' or length(v_answer)>600 then raise exception 'الإجابة فارغة أو طويلة جداً'; end if;
  if v_game.game_key='truth' and not (v_state->'truthChoice' ? v_role) then raise exception 'اختر صراحة أم تحدي أولاً'; end if;
  if v_game.game_key in ('thisorthat','compatibility') then
   v_order:=v_state->'questionOrder'->v_game.game_key;
   v_index:=v_round-1;
   if jsonb_typeof(v_order)='array' and jsonb_array_length(v_order)>0 then v_index:=(v_order->>((v_round-1)%jsonb_array_length(v_order)))::integer; end if;
   if not public.ayfar_game_choice_valid(v_game.game_key,v_index,v_answer) then raise exception 'هذا الاختيار لا يطابق خيارات السؤال الحالي'; end if;
  end if;
  v_answers:=v_answers||jsonb_build_object(v_role,v_answer);
  v_state:=v_state||jsonb_build_object('answers',v_answers);
  if v_answers ? 'ayoub' and v_answers ? 'farahati' then
   if v_game.game_key in ('qa','truth') then
    v_scores:=jsonb_build_object(
     'ayoub',coalesce((v_scores->>'ayoub')::integer,0)+case when v_answers->>'ayoub' not in ('[تم التخطي]','[انتهى الوقت]') then 1 else 0 end,
     'farahati',coalesce((v_scores->>'farahati')::integer,0)+case when v_answers->>'farahati' not in ('[تم التخطي]','[انتهى الوقت]') then 1 else 0 end);
   elsif v_answers->>'ayoub'=v_answers->>'farahati' then
    v_scores:=jsonb_build_object('ayoub',coalesce((v_scores->>'ayoub')::integer,0)+1,'farahati',coalesce((v_scores->>'farahati')::integer,0)+1);
   end if;
   v_state:=v_state||jsonb_build_object('scores',v_scores,'scoredRound',v_round);
  end if;

 elsif p_action='truth_choice' then
  if v_game.game_key<>'truth' or v_state->>'phase'<>'play' then raise exception 'اختيار البطاقة غير متاح'; end if;
  if p_payload->>'choice' not in ('صراحة','تحدي') then raise exception 'اختيار غير صالح'; end if;
  if v_state->'truthChoice' ? v_role then raise exception 'لقد اخترت بطاقتك بالفعل'; end if;
  v_state:=v_state||jsonb_build_object('truthChoice',coalesce(v_state->'truthChoice','{}'::jsonb)||jsonb_build_object(v_role,p_payload->>'choice'));

 elsif p_action='truth_skip' then
  if v_game.game_key<>'truth' or v_state->>'phase'<>'play' then raise exception 'لا يمكن تخطي البطاقة الآن'; end if;
  if v_answers ? v_role then raise exception 'لقد أرسلت ردك بالفعل'; end if;
  if not (v_state->'truthChoice' ? v_role) then raise exception 'اختر صراحة أم تحدي أولاً'; end if;
  v_answers:=v_answers||jsonb_build_object(v_role,'[تم التخطي]');
  v_state:=v_state||jsonb_build_object('answers',v_answers);
  if v_answers ? 'ayoub' and v_answers ? 'farahati' then
   v_scores:=jsonb_build_object('ayoub',coalesce((v_scores->>'ayoub')::integer,0)+case when v_answers->>'ayoub' not in ('[تم التخطي]','[انتهى الوقت]') then 1 else 0 end,'farahati',coalesce((v_scores->>'farahati')::integer,0)+case when v_answers->>'farahati' not in ('[تم التخطي]','[انتهى الوقت]') then 1 else 0 end);
   v_state:=v_state||jsonb_build_object('scores',v_scores,'scoredRound',v_round);
  end if;

 elsif p_action='who_submit' then
  if v_game.game_key<>'who' or v_state->>'phase'<>'play' then raise exception 'هذه الحركة غير متاحة في هذه اللعبة'; end if;
  if v_submitted ? v_role then raise exception 'لقد أرسلت إجابتك وتخمينك بالفعل'; end if;
  v_answer:=btrim(coalesce(p_payload->>'answer','')); v_guess:=btrim(coalesce(p_payload->>'guess',''));
  if v_answer='' or v_guess='' or length(v_answer)>300 or length(v_guess)>300 then raise exception 'أكمل الإجابة والتخمين ضمن الحد المسموح'; end if;
  v_truth:=v_truth||jsonb_build_object(v_role,v_answer);
  v_guesses:=v_guesses||jsonb_build_object(v_role,v_guess);
  v_submitted:=v_submitted||jsonb_build_object(v_role,true);
  v_state:=v_state||jsonb_build_object('truthAnswers',v_truth,'guesses',v_guesses,'whoSubmitted',v_submitted);

 elsif p_action='who_judge' then
  if v_game.game_key<>'who' or v_state->>'phase'<>'play' then raise exception 'التقييم غير متاح'; end if;
  if not (v_submitted ? 'ayoub' and v_submitted ? 'farahati') then raise exception 'ننتظر إجابة الطرفين أولاً'; end if;
  if v_judgments ? v_role then raise exception 'لقد سجلت تقييمك بالفعل'; end if;
  if p_payload->>'correct' not in ('true','false') then raise exception 'تقييم غير صالح'; end if;
  v_judgments:=v_judgments||jsonb_build_object(v_role,(p_payload->>'correct')::boolean);
  v_state:=v_state||jsonb_build_object('whoJudgments',v_judgments);
  if v_judgments ? 'ayoub' and v_judgments ? 'farahati' then
   if coalesce((v_judgments->>'ayoub')::boolean,false) then v_scores:=jsonb_set(v_scores,'{farahati}',to_jsonb(coalesce((v_scores->>'farahati')::integer,0)+1),true); end if;
   if coalesce((v_judgments->>'farahati')::boolean,false) then v_scores:=jsonb_set(v_scores,'{ayoub}',to_jsonb(coalesce((v_scores->>'ayoub')::integer,0)+1),true); end if;
   v_state:=v_state||jsonb_build_object('scores',v_scores,'whoScoredRound',v_round,'scoredRound',v_round);
  end if;

 elsif p_action='predict_actual' then
  if v_game.game_key<>'predict' or v_state->>'phase'<>'play' then raise exception 'اختيار التوقع غير متاح'; end if;
  v_predictor:=case when v_round%2=1 then 'ayoub' else 'farahati' end;
  if v_role<>case when v_predictor='ayoub' then 'farahati' else 'ayoub' end then raise exception 'هذا الاختيار مخصص للطرف الآخر'; end if;
  if coalesce(v_state->>'actualChoice','')<>'' then raise exception 'تم تثبيت الاختيار الحقيقي بالفعل'; end if;
  v_answer:=btrim(coalesce(p_payload->>'choice',''));
  if v_answer='' or length(v_answer)>300 then raise exception 'اكتب اختياراً صالحاً'; end if;
  v_state:=v_state||jsonb_build_object('actualChoice',v_answer);

 elsif p_action='predict_guess' then
  if v_game.game_key<>'predict' or v_state->>'phase'<>'play' then raise exception 'التوقع غير متاح'; end if;
  v_predictor:=case when v_round%2=1 then 'ayoub' else 'farahati' end;
  if v_role<>v_predictor then raise exception 'التوقع مخصص للطرف المتوقع منه'; end if;
  if coalesce(v_state->>'actualChoice','')='' then raise exception 'ننتظر الاختيار الحقيقي أولاً'; end if;
  if coalesce(v_state->>'prediction','')<>'' then raise exception 'لقد أرسلت توقعك بالفعل'; end if;
  v_guess:=btrim(coalesce(p_payload->>'prediction',''));
  if v_guess='' or length(v_guess)>300 then raise exception 'اكتب توقعاً صالحاً'; end if;
  v_state:=v_state||jsonb_build_object('prediction',v_guess);
  if public.ayfar_game_normalize_text(v_guess)=public.ayfar_game_normalize_text(v_state->>'actualChoice') then
   v_scores:=jsonb_set(v_scores,array[v_predictor],to_jsonb(coalesce((v_scores->>v_predictor)::integer,0)+1),true);
  end if;
  v_state:=v_state||jsonb_build_object('scores',v_scores,'predictScoredRound',v_round,'scoredRound',v_round);

 elsif p_action='next' then
  if v_state->>'phase'<>'play' then raise exception 'لا يمكن الانتقال في هذه المرحلة'; end if;
  if v_game.game_key='who' then
   if not (v_judgments ? 'ayoub' and v_judgments ? 'farahati') or coalesce((v_state->>'whoScoredRound')::integer,0)<>v_round then raise exception 'ننتظر التقييمين واحتساب النتيجة'; end if;
  elsif v_game.game_key='predict' then
   if coalesce(v_state->>'actualChoice','')='' or coalesce(v_state->>'prediction','')='' or coalesce((v_state->>'predictScoredRound')::integer,0)<>v_round then raise exception 'ننتظر الاختيار والتوقع واحتساب النتيجة'; end if;
  else
   if not (v_answers ? 'ayoub' and v_answers ? 'farahati') or coalesce((v_state->>'scoredRound')::integer,0)<>v_round then raise exception 'ننتظر إجابة الطرفين واحتساب النتيجة'; end if;
  end if;
  v_next_round:=v_round+1;
  v_state:=v_state-array['answers','truthChoice','truthAnswers','guesses','whoSubmitted','whoJudgments','whoScoredRound','actualChoice','prediction','predictScoredRound','roundResult'];
  v_state:=v_state||jsonb_build_object('round',v_next_round,'phase',case when v_next_round>coalesce((v_state->>'total')::integer,5) then 'finished' else 'play' end,'answers','{}'::jsonb,'truthChoice','{}'::jsonb,'scoredRound',0);
  if v_next_round>coalesce((v_game.state->>'total')::integer,5) then
   update public.ayfar_games set state=v_state,status='finished',version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
  else
   update public.ayfar_games set state=v_state,version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
  end if;
  return v_game;
 else
  raise exception 'نوع الحركة غير معروف';
 end if;
 update public.ayfar_games set state=v_state,version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

-- General client updates are now restricted to chat metadata for every game type.
create or replace function public.ayfar_game_update(p_game_id uuid,p_expected_version bigint,p_state jsonb,p_status text default null)
returns public.ayfar_games
language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_game public.ayfar_games; v_chat jsonb; v_next jsonb;
begin
 if v_user is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
 select * into v_game from public.ayfar_games where id=p_game_id for update;
 if not found then raise exception 'المباراة غير موجودة'; end if;
 if v_user<>v_game.host_id and (v_game.guest_id is null or v_user<>v_game.guest_id) then raise exception 'لست مشاركاً في هذه المباراة'; end if;
 if v_game.version<>p_expected_version then raise exception 'تغيرت المباراة على الهاتف الآخر؛ حدّث الحالة وحاول مجدداً'; end if;
 if v_game.status in ('finished','cancelled') then raise exception 'انتهت هذه المباراة'; end if;
 v_chat:=jsonb_build_object(
  'chatMessages',coalesce(nullif(p_state->'chatMessages','null'::jsonb),v_game.state->'chatMessages'),
  'chatReadAt',coalesce(nullif(p_state->'chatReadAt','null'::jsonb),v_game.state->'chatReadAt'),
  'chatTyping',coalesce(nullif(p_state->'chatTyping','null'::jsonb),v_game.state->'chatTyping'),
  'lastChatAt',coalesce(nullif(p_state->'lastChatAt','null'::jsonb),v_game.state->'lastChatAt'),
  'chatReactions',coalesce(nullif(p_state->'chatReactions','null'::jsonb),v_game.state->'chatReactions')
 );
 v_next:=(v_game.state-array['chatMessages','chatReadAt','chatTyping','lastChatAt','chatReactions'])||v_chat;
 update public.ayfar_games set state=v_next,version=version+1,updated_at=now() where id=p_game_id returning * into v_game;
 return v_game;
end $$;

revoke all on function public.ayfar_game_choice_valid(text,integer,text) from public,anon,authenticated;
revoke all on function public.ayfar_game_normalize_text(text) from public,anon,authenticated;
revoke all on function public.ayfar_game_action(uuid,bigint,text,jsonb) from public,anon;
grant execute on function public.ayfar_game_action(uuid,bigint,text,jsonb) to authenticated;
revoke all on function public.ayfar_game_update(uuid,bigint,jsonb,text) from public,anon;
grant execute on function public.ayfar_game_update(uuid,bigint,jsonb,text) to authenticated;
