-- AYFAR WORLD · serialize AI quiz submissions to prevent one player's answer overwriting the other's.
-- Safe to run on existing projects: creates the session table only when it does not already exist.

create table if not exists public.ayfar_ai_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references public.ayfar_games(id) on delete cascade,
  questions jsonb not null,
  current_index integer not null default 0 check (current_index between 0 and 14),
  submissions jsonb not null default '{}'::jsonb,
  results jsonb,
  status text not null default 'active' check (status in ('active','revealed','finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ayfar_ai_quiz_sessions enable row level security;
revoke all on public.ayfar_ai_quiz_sessions from anon, authenticated;
grant all on public.ayfar_ai_quiz_sessions to service_role;

create or replace function public.ayfar_ai_quiz_submit_answer(
  p_session_id uuid,
  p_role text,
  p_answer text
)
returns public.ayfar_ai_quiz_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.ayfar_ai_quiz_sessions;
  v_answer text := left(btrim(coalesce(p_answer, '')), 240);
begin
  if p_role not in ('ayoub', 'farhati') then
    raise exception 'دور اللاعب غير صالح';
  end if;
  if v_answer = '' then
    raise exception 'الإجابة فارغة';
  end if;

  update public.ayfar_ai_quiz_sessions
  set submissions = coalesce(submissions, '{}'::jsonb) || jsonb_build_object(p_role, v_answer),
      updated_at = now()
  where id = p_session_id
    and status = 'active'
    and not (coalesce(submissions, '{}'::jsonb) ? p_role)
  returning * into v_session;

  if found then
    return v_session;
  end if;

  select * into v_session
  from public.ayfar_ai_quiz_sessions
  where id = p_session_id;

  if not found then
    raise exception 'جلسة المسابقة غير موجودة';
  end if;
  if v_session.status <> 'active' then
    raise exception 'هذه الجولة مكتملة بالفعل';
  end if;
  if coalesce(v_session.submissions, '{}'::jsonb) ? p_role then
    raise exception 'سبق أن أرسلت إجابتك لهذه الجولة';
  end if;
  raise exception 'تعذر حفظ الإجابة؛ أعد المحاولة';
end;
$$;

revoke all on function public.ayfar_ai_quiz_submit_answer(uuid, text, text) from public, anon, authenticated;
grant execute on function public.ayfar_ai_quiz_submit_answer(uuid, text, text) to service_role;
