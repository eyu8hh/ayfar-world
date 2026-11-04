-- AYFAR WORLD · recoverable, single-worker AI answer grading.
alter table public.ayfar_ai_quiz_sessions
  add column if not exists grading_started_at timestamptz;

create or replace function public.ayfar_ai_quiz_claim_grading(p_session_id uuid)
returns public.ayfar_ai_quiz_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.ayfar_ai_quiz_sessions;
begin
  update public.ayfar_ai_quiz_sessions
  set grading_started_at = now(), updated_at = now()
  where id = p_session_id
    and status = 'active'
    and coalesce(submissions, '{}'::jsonb) ? 'ayoub'
    and coalesce(submissions, '{}'::jsonb) ? 'farhati'
    and (grading_started_at is null or grading_started_at < now() - interval '2 minutes')
  returning * into v_session;
  if found then return v_session; end if;
  return null;
end;
$$;

revoke all on function public.ayfar_ai_quiz_claim_grading(uuid) from public, anon, authenticated;
grant execute on function public.ayfar_ai_quiz_claim_grading(uuid) to service_role;
