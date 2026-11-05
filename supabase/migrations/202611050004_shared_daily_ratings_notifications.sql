-- AYFAR WORLD · shared daily check-ins and private activity notifications
-- Additive only: preserves all existing ratings in local storage and all existing data.

create table if not exists public.ayfar_daily_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating_day date not null,
  score smallint not null check (score between 1 and 5),
  note text not null default '' check (char_length(note) <= 500),
  updated_at timestamptz not null default now(),
  unique(user_id,rating_day)
);
alter table public.ayfar_daily_ratings enable row level security;
drop policy if exists "AYFAR pair read daily ratings" on public.ayfar_daily_ratings;
create policy "AYFAR pair read daily ratings" on public.ayfar_daily_ratings for select to authenticated
using (user_id=auth.uid() or public.ayfar_is_routine_partner(user_id));
drop policy if exists "AYFAR users manage own daily ratings" on public.ayfar_daily_ratings;
create policy "AYFAR users manage own daily ratings" on public.ayfar_daily_ratings for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select,insert,update,delete on public.ayfar_daily_ratings to authenticated;

create table if not exists public.ayfar_notifications (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 50),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  reference_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists ayfar_notifications_recipient_idx
  on public.ayfar_notifications(recipient_id,created_at desc);
alter table public.ayfar_notifications enable row level security;
drop policy if exists "AYFAR users read own notifications" on public.ayfar_notifications;
create policy "AYFAR users read own notifications" on public.ayfar_notifications
for select to authenticated using (recipient_id=auth.uid());
drop policy if exists "AYFAR users mark own notifications read" on public.ayfar_notifications;
create policy "AYFAR users mark own notifications read" on public.ayfar_notifications
for update to authenticated using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());
grant select,update on public.ayfar_notifications to authenticated;

create or replace function public.ayfar_send_notification(
  p_actor uuid,p_recipient uuid,p_type text,p_title text,p_body text,p_reference uuid default null
) returns void language plpgsql security definer set search_path=public,auth
as $$
begin
  if p_actor is null or p_recipient is null or p_actor=p_recipient then return; end if;
  insert into public.ayfar_notifications(actor_id,recipient_id,event_type,title,body,reference_id)
  values(p_actor,p_recipient,p_type,left(p_title,120),left(coalesce(p_body,''),500),p_reference);
end $$;
revoke all on function public.ayfar_send_notification(uuid,uuid,text,text,text,uuid) from public,anon,authenticated;

create or replace function public.ayfar_partner_user_id(p_actor uuid)
returns uuid language sql stable security definer set search_path=public,auth
as $$
  select p.id from public.profiles p
  where p.id<>p_actor and (
    (exists(select 1 from public.profiles a where a.id=p_actor and lower(a.role)='ayoub') and lower(p.role) in ('farahati','farhati'))
    or
    (exists(select 1 from public.profiles a where a.id=p_actor and lower(a.role) in ('farahati','farhati')) and lower(p.role)='ayoub')
  ) limit 1
$$;
revoke all on function public.ayfar_partner_user_id(uuid) from public,anon,authenticated;

create or replace function public.ayfar_notify_daily_rating()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare partner uuid;
begin
  partner:=public.ayfar_partner_user_id(new.user_id);
  perform public.ayfar_send_notification(new.user_id,partner,'daily_rating','كيف كان يومي؟',
    'شارك/ت تقييم اليوم: '||new.score||'/5 قلوب'||case when new.note<>'' then ' — '||new.note else '' end,new.id);
  return new;
end $$;
drop trigger if exists ayfar_daily_rating_notify on public.ayfar_daily_ratings;
create trigger ayfar_daily_rating_notify after insert or update on public.ayfar_daily_ratings
for each row execute function public.ayfar_notify_daily_rating();

create or replace function public.ayfar_notify_routine_status()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare partner uuid;
begin
  if new.visibility<>'shared' then return new; end if;
  partner:=public.ayfar_partner_user_id(new.user_id);
  perform public.ayfar_send_notification(new.user_id,partner,'routine_status','تحديث الحالة اليومية',
    coalesce(new.activity_label,'حدّث/ت حالته')||case when coalesce(new.note,'')<>'' then ' — '||new.note else '' end,new.user_id);
  return new;
end $$;
drop trigger if exists ayfar_routine_status_notify on public.ayfar_routine_status;
create trigger ayfar_routine_status_notify after insert or update on public.ayfar_routine_status
for each row execute function public.ayfar_notify_routine_status();

alter table public.ayfar_star_history add column if not exists changed_by uuid references auth.users(id) on delete set null;
create or replace function public.change_ayfar_stars(p_delta bigint,p_reason text default null)
returns bigint language plpgsql security definer set search_path=public
as $$
declare new_balance bigint;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role in ('farhati','farahati')) then
    raise exception 'فقط فرحتي تستطيع تغيير رصيد النجوم';
  end if;
  if p_delta=0 then raise exception 'يجب أن يكون التغيير أكبر أو أقل من صفر'; end if;
  update public.ayfar_star_wallet set balance=balance+p_delta,updated_at=now()
  where id=1 and balance+p_delta>=0 returning balance into new_balance;
  if new_balance is null then raise exception 'الرصيد لا يسمح بهذا الخصم'; end if;
  insert into public.ayfar_star_history(delta,balance_after,reason,changed_by)
  values(p_delta,new_balance,nullif(trim(coalesce(p_reason,'')),''),auth.uid());
  return new_balance;
end $$;
grant execute on function public.change_ayfar_stars(bigint,text) to authenticated;

create or replace function public.ayfar_notify_star_change()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare partner uuid;
begin
  partner:=public.ayfar_partner_user_id(new.changed_by);
  perform public.ayfar_send_notification(new.changed_by,partner,'star_change','تغيير في نجوم أيوب',
    (case when new.delta>0 then 'أضافت ' else 'خصمت ' end)||abs(new.delta)||' نجمة'||case when coalesce(new.reason,'')<>'' then ' — '||new.reason else '' end,null);
  return new;
end $$;
drop trigger if exists ayfar_star_history_notify on public.ayfar_star_history;
create trigger ayfar_star_history_notify after insert on public.ayfar_star_history
for each row execute function public.ayfar_notify_star_change();

create or replace function public.ayfar_notify_habit_checkin()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare habit_title text; habit_owner_id uuid; partner uuid;
begin
  select h.title,h.user_id into habit_title,habit_owner_id from public.ayfar_habits h where h.id=new.habit_id;
  if new.checked_by=habit_owner_id then partner:=public.ayfar_partner_user_id(new.checked_by);
  else partner:=habit_owner_id; end if;
  perform public.ayfar_send_notification(new.checked_by,partner,'habit_checkin','إنجاز عادة 🌱',
    'تم التأشير على عادة: '||coalesce(habit_title,'عادة مشتركة'),new.habit_id);
  return new;
end $$;
drop trigger if exists ayfar_habit_checkin_notify on public.ayfar_habit_checkins;
create trigger ayfar_habit_checkin_notify after insert on public.ayfar_habit_checkins
for each row execute function public.ayfar_notify_habit_checkin();

create or replace function public.ayfar_notify_pet_care()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare pet_name text;
begin
  select p.pet_name into pet_name from public.ayfar_pets p where p.owner_id=new.pet_owner;
  perform public.ayfar_send_notification(new.cared_by,new.pet_owner,'pet_care','اهتمام بالرفيق 🐾',
    'قامت فرحتي/أيوب بالعناية بـ '||coalesce(pet_name,'رفيقكما')||' ('||new.action_key||')',null);
  return new;
end $$;
drop trigger if exists ayfar_pet_care_notify on public.ayfar_pet_care_log;
create trigger ayfar_pet_care_notify after insert on public.ayfar_pet_care_log
for each row execute function public.ayfar_notify_pet_care();

create or replace function public.ayfar_notify_music_added()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare partner uuid;
begin
  partner:=public.ayfar_partner_user_id(new.added_by);
  perform public.ayfar_send_notification(new.added_by,partner,'music_added','أضيفت موسيقى جديدة 🎧',new.title,new.id);
  return new;
end $$;
drop trigger if exists ayfar_shared_music_notify on public.ayfar_shared_music;
create trigger ayfar_shared_music_notify after insert on public.ayfar_shared_music
for each row execute function public.ayfar_notify_music_added();

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_daily_ratings') then alter publication supabase_realtime add table public.ayfar_daily_ratings; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_notifications') then alter publication supabase_realtime add table public.ayfar_notifications; end if;
end $$;
