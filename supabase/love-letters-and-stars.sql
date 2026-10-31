-- AYFAR WORLD: daily love letters and Ayoub's star balance
-- Run once in Supabase SQL Editor.

create table if not exists public.love_letters (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  opened_at timestamptz
);
alter table public.love_letters enable row level security;
drop policy if exists "Ayoub manages love letters" on public.love_letters;
create policy "Ayoub manages love letters" on public.love_letters
for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ayoub'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ayoub'));
grant select, insert, update, delete on public.love_letters to authenticated;

create or replace function public.get_daily_love_letter()
returns table(letter_id uuid, letter_body text, letter_created_at timestamptz)
language plpgsql security definer set search_path=public
as $$
declare last_opened date;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='farhati') then
    raise exception 'غير مصرح';
  end if;
  select max(opened_at::date) into last_opened from public.love_letters where opened_at is not null;
  if last_opened=current_date then return; end if;
  return query
    select id,body,created_at from public.love_letters
    where opened_at is null order by created_at asc limit 1;
end $$;

create or replace function public.open_daily_love_letter(p_letter_id uuid)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare last_opened date; next_id uuid;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='farhati') then
    raise exception 'غير مصرح';
  end if;
  select max(opened_at::date) into last_opened from public.love_letters where opened_at is not null;
  if last_opened=current_date then return false; end if;
  select id into next_id from public.love_letters where opened_at is null order by created_at asc limit 1;
  if next_id is null or next_id<>p_letter_id then return false; end if;
  update public.love_letters set opened_at=now() where id=p_letter_id and opened_at is null;
  return found;
end $$;

create table if not exists public.ayfar_star_wallet (
  id integer primary key check (id=1),
  balance bigint not null default 0 check (balance>=0),
  updated_at timestamptz not null default now()
);
insert into public.ayfar_star_wallet(id,balance) values(1,0) on conflict(id) do nothing;
alter table public.ayfar_star_wallet enable row level security;
drop policy if exists "Both can view star wallet" on public.ayfar_star_wallet;
create policy "Both can view star wallet" on public.ayfar_star_wallet
for select to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role in ('ayoub','farhati')));
grant select on public.ayfar_star_wallet to authenticated;

create table if not exists public.ayfar_star_history (
  id bigint generated always as identity primary key,
  delta bigint not null check(delta<>0),
  balance_after bigint not null check(balance_after>=0),
  reason text,
  changed_at timestamptz not null default now()
);
alter table public.ayfar_star_history enable row level security;
drop policy if exists "Both can view star history" on public.ayfar_star_history;
create policy "Both can view star history" on public.ayfar_star_history
for select to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role in ('ayoub','farhati')));
grant select on public.ayfar_star_history to authenticated;

create or replace function public.change_ayfar_stars(p_delta bigint,p_reason text default null)
returns bigint
language plpgsql security definer set search_path=public
as $$
declare new_balance bigint;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='farhati') then
    raise exception 'فقط فرحتي تستطيع تغيير رصيد النجوم';
  end if;
  if p_delta=0 then raise exception 'يجب أن يكون التغيير أكبر أو أقل من صفر'; end if;
  update public.ayfar_star_wallet
    set balance=balance+p_delta,updated_at=now()
    where id=1 and balance+p_delta>=0
    returning balance into new_balance;
  if new_balance is null then raise exception 'الرصيد لا يسمح بهذا الخصم'; end if;
  insert into public.ayfar_star_history(delta,balance_after,reason)
    values(p_delta,new_balance,nullif(trim(coalesce(p_reason,'')),''));
  return new_balance;
end $$;

grant execute on function public.get_daily_love_letter() to authenticated;
grant execute on function public.open_daily_love_letter(uuid) to authenticated;
grant execute on function public.change_ayfar_stars(bigint,text) to authenticated;

-- Permit replies in either direction while restricting both accounts to each other.
drop policy if exists "ayoub can send to farahati" on public.private_messages;
drop policy if exists "both can send private messages to each other" on public.private_messages;
create policy "both can send private messages to each other"
on public.private_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    (exists(select 1 from public.profiles where id=auth.uid() and role='ayoub')
      and exists(select 1 from public.profiles where id=recipient_id and role='farhati'))
    or
    (exists(select 1 from public.profiles where id=auth.uid() and role='farhati')
      and exists(select 1 from public.profiles where id=recipient_id and role='ayoub'))
  )
);
