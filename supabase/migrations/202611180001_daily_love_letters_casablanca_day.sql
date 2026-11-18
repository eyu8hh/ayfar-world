-- AYFAR WORLD: use Morocco's civil date for the one-letter-per-day rule.
-- Safe to apply more than once. No tables, columns, roles, or policies are changed.
-- The transaction-scoped advisory lock serializes concurrent open attempts.

create or replace function public.get_daily_love_letter()
returns table(letter_id uuid, letter_body text, letter_created_at timestamptz)
language plpgsql
security definer
set search_path=public
as $$
declare
  last_opened date;
  morocco_today date;
begin
  if not exists (
    select 1 from public.profiles
    where id=auth.uid() and role in ('farhati','farahati')
  ) then
    raise exception 'غير مصرح';
  end if;

  morocco_today := (clock_timestamp() at time zone 'Africa/Casablanca')::date;

  select max((opened_at at time zone 'Africa/Casablanca')::date)
    into last_opened
    from public.love_letters
    where opened_at is not null;

  if last_opened=morocco_today then
    return;
  end if;

  return query
    select id,body,created_at
    from public.love_letters
    where opened_at is null
    order by created_at asc
    limit 1;
end;
$$;

create or replace function public.open_daily_love_letter(p_letter_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  last_opened date;
  next_id uuid;
  morocco_today date;
begin
  if not exists (
    select 1 from public.profiles
    where id=auth.uid() and role in ('farhati','farahati')
  ) then
    raise exception 'غير مصرح';
  end if;

  -- Only one transaction can claim today's letter at a time.
  perform pg_advisory_xact_lock(20261118, 1);

  -- clock_timestamp() is deliberate: now() would retain the transaction start
  -- time while this transaction waits for the lock across a midnight boundary.
  morocco_today := (clock_timestamp() at time zone 'Africa/Casablanca')::date;

  select max((opened_at at time zone 'Africa/Casablanca')::date)
    into last_opened
    from public.love_letters
    where opened_at is not null;

  if last_opened=morocco_today then
    return false;
  end if;

  select id into next_id
    from public.love_letters
    where opened_at is null
    order by created_at asc
    limit 1;

  if next_id is null or next_id<>p_letter_id then
    return false;
  end if;

  update public.love_letters
    set opened_at=clock_timestamp()
    where id=p_letter_id and opened_at is null;

  return found;
end;
$$;

grant execute on function public.get_daily_love_letter() to authenticated;
grant execute on function public.open_daily_love_letter(uuid) to authenticated;
