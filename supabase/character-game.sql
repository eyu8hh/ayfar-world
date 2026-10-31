-- AYFAR WORLD: secure two-phone "Guess Who" game
create table if not exists public.character_game_state (
  id integer primary key check (id = 1),
  state jsonb not null default '{"stage":"pick","picks":{"ayoub":null,"farhati":null},"turns":{"ayoub":{"questions":0,"attempts":0,"guessed":false,"points":0},"farhati":{"questions":0,"attempts":0,"guessed":false,"points":0}},"asker":"ayoub","question":null,"answer":null,"finished":false}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.character_game_state(id) values (1) on conflict (id) do nothing;
alter table public.character_game_state enable row level security;
revoke all on public.character_game_state from anon, authenticated;

create or replace function public.ayfar_character_role()
returns text language sql stable security definer set search_path=public
as $$
  select case when role='farahati' then 'farhati' else role end
  from public.profiles where id=auth.uid() and role in ('ayoub','farhati','farahati')
$$;

create or replace function public.character_game_get()
returns jsonb language plpgsql security definer set search_path=public
as $$
declare s jsonb; p text;
begin
 p:=public.ayfar_character_role();
 if p is null then raise exception 'غير مصرح'; end if;
 select state into s from public.character_game_state where id=1;
 if s is null then raise exception 'لم يتم إعداد اللعبة'; end if;
 if s->>'finished' <> 'true' then
   s:=jsonb_set(s,'{picks}',jsonb_build_object('ayoub',case when p='ayoub' then s#>'{picks,ayoub}' else 'null'::jsonb end,'farhati',case when p='farhati' then s#>'{picks,farhati}' else 'null'::jsonb end));
 end if;
 return s;
end $$;

create or replace function public.character_game_act(action_name text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare s jsonb; p text; other text; t jsonb; g text;
begin
 p:=public.ayfar_character_role();
 if p is null then raise exception 'غير مصرح'; end if;
 other:=case when p='ayoub' then 'farhati' else 'ayoub' end;
 select state into s from public.character_game_state where id=1 for update;
 if s is null then raise exception 'لم يتم إعداد اللعبة'; end if;
 if action_name='reset' then
   s:='{"stage":"pick","picks":{"ayoub":null,"farhati":null},"turns":{"ayoub":{"questions":0,"attempts":0,"guessed":false,"points":0},"farhati":{"questions":0,"attempts":0,"guessed":false,"points":0}},"asker":"ayoub","question":null,"answer":null,"finished":false}'::jsonb;
 elsif action_name='pick' then
   if s->>'finished'='true' or s#>>array['picks',p] is not null then raise exception 'لقد اخترت شخصيتك بالفعل'; end if;
   if coalesce(payload->>'character','')='' or length(payload->>'character')>80 then raise exception 'اختيار غير صالح'; end if;
   s:=jsonb_set(s,array['picks',p],to_jsonb(payload->>'character'));
   if s#>>'{picks,ayoub}' is not null and s#>>'{picks,farhati}' is not null then s:=jsonb_set(s,'{stage}','"ask"'); end if;
 elsif action_name='question' then
   if s->>'stage'<>'ask' or s->>'asker'<>p then raise exception 'ليس دورك لطرح السؤال'; end if;
   if length(trim(coalesce(payload->>'question','')))<2 or length(payload->>'question')>180 then raise exception 'اكتب سؤالاً صحيحاً'; end if;
   t:=s#>array['turns',p];
   if coalesce((t->>'questions')::int,0)>=15 then raise exception 'انتهت أسئلتك'; end if;
   s:=jsonb_set(s,'{question}',to_jsonb(trim(payload->>'question')));
   s:=jsonb_set(s,'{answer}', 'null'::jsonb);
   s:=jsonb_set(s,array['turns',p,'questions'],to_jsonb((coalesce((t->>'questions')::int,0)+1)));
   s:=jsonb_set(s,'{stage}','"answer"');
 elsif action_name='answer' then
   if s->>'stage'<>'answer' or s->>'asker'=p then raise exception 'ليس دورك للإجابة'; end if;
   if payload->>'answer' not in ('yes','no') then raise exception 'إجابة غير صالحة'; end if;
   s:=jsonb_set(s,'{answer}',to_jsonb(payload->>'answer'));
   s:=jsonb_set(s,'{stage}','"guess"');
 elsif action_name='guess' then
   if s->>'stage'<>'guess' or s->>'asker'<>p then raise exception 'ليس دورك للتخمين'; end if;
   if coalesce(payload->>'guess','')='' then raise exception 'اختر تخميناً'; end if;
   if payload->>'guess'=s#>>array['picks',other] then
     t:=s#>array['turns',p]; g:=case when (t->>'questions')::int<=5 then '5' when (t->>'questions')::int<=10 then '3' else '1' end;
     s:=jsonb_set(s,array['turns',p,'guessed'],'true'::jsonb);
     s:=jsonb_set(s,array['turns',p,'points'],to_jsonb(g::int));
   else
     t:=s#>array['turns',p];
     s:=jsonb_set(s,array['turns',p,'attempts'],to_jsonb(coalesce((t->>'attempts')::int,0)+1));
   end if;
   if (s#>>'{turns,ayoub,guessed}'='true' or (s#>>'{turns,ayoub,questions}')::int>=15)
      and (s#>>'{turns,farhati,guessed}'='true' or (s#>>'{turns,farhati,questions}')::int>=15) then
      s:=jsonb_set(s,'{finished}','true'::jsonb); s:=jsonb_set(s,'{stage}','"result"');
   else
      s:=jsonb_set(s,'{asker}',to_jsonb(other));
      s:=jsonb_set(s,'{stage}','"ask"');
   end if;
 else raise exception 'إجراء غير معروف'; end if;
 update public.character_game_state set state=s,updated_at=now() where id=1;
 return public.character_game_get();
end $$;
grant execute on function public.character_game_get() to authenticated;
grant execute on function public.character_game_act(text,jsonb) to authenticated;
