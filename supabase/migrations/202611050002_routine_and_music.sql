-- AYFAR WORLD · shared live routines, moods and YouTube music
-- Safe additive migration. Run once in Supabase SQL Editor after deploying the matching app update.

create table if not exists public.ayfar_routine_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('ayoub','farahati')),
  activity_key text not null default 'available' check (char_length(activity_key) between 1 and 80),
  activity_label text not null default 'متاح / متاحة الآن' check (char_length(activity_label) between 1 and 100),
  category text not null default 'social' check (char_length(category) between 1 and 40),
  mood text not null default 'calm' check (char_length(mood) between 1 and 40),
  note text not null default '' check (char_length(note) <= 160),
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  share_mood boolean not null default true,
  duration_minutes integer not null default 0 check (duration_minutes in (0,15,30,60,120,240,480)),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists ayfar_routine_status_visibility_idx
  on public.ayfar_routine_status(visibility, updated_at desc);

alter table public.ayfar_routine_status enable row level security;

drop policy if exists "AYFAR routine pair can read shared status" on public.ayfar_routine_status;
create policy "AYFAR routine pair can read shared status"
on public.ayfar_routine_status for select to authenticated
using (
  user_id = auth.uid()
  or (
    visibility = 'shared'
    and exists (
      select 1
      from public.profiles viewer
      join public.profiles owner_profile on owner_profile.id = ayfar_routine_status.user_id
      where viewer.id = auth.uid()
        and (
          (lower(viewer.role) = 'ayoub' and lower(owner_profile.role) in ('farahati','farhati'))
          or
          (lower(viewer.role) in ('farahati','farhati') and lower(owner_profile.role) = 'ayoub')
        )
    )
  )
);

drop policy if exists "AYFAR users manage own routine status" on public.ayfar_routine_status;
create policy "AYFAR users manage own routine status"
on public.ayfar_routine_status for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')
      and case when lower(p.role) in ('farahati','farhati') then 'farahati' else 'ayoub' end = ayfar_routine_status.role
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and lower(p.role) in ('ayoub','farahati','farhati')
      and case when lower(p.role) in ('farahati','farhati') then 'farahati' else 'ayoub' end = ayfar_routine_status.role
  )
);

grant select, insert, update, delete on public.ayfar_routine_status to authenticated;

create table if not exists public.ayfar_shared_music (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  youtube_url text not null check (char_length(youtube_url) between 8 and 500),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{6,80}$'),
  media_type text not null check (media_type in ('playlist','video')),
  mood text not null default 'عام' check (char_length(mood) between 1 and 30),
  added_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ayfar_shared_music_created_idx
  on public.ayfar_shared_music(created_at desc);

alter table public.ayfar_shared_music enable row level security;

drop policy if exists "AYFAR pair can read shared music" on public.ayfar_shared_music;
create policy "AYFAR pair can read shared music"
on public.ayfar_shared_music for select to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and (
        (lower(viewer.role) = 'ayoub' and exists (
          select 1 from public.profiles partner
          where lower(partner.role) in ('farahati','farhati')
        ))
        or
        (lower(viewer.role) in ('farahati','farhati') and exists (
          select 1 from public.profiles partner
          where lower(partner.role) = 'ayoub'
        ))
      )
  )
);

drop policy if exists "AYFAR pair can add shared music" on public.ayfar_shared_music;
create policy "AYFAR pair can add shared music"
on public.ayfar_shared_music for insert to authenticated
with check (
  added_by = auth.uid()
  and exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and (
        (lower(viewer.role) = 'ayoub' and exists (
          select 1 from public.profiles partner
          where lower(partner.role) in ('farahati','farhati')
        ))
        or
        (lower(viewer.role) in ('farahati','farhati') and exists (
          select 1 from public.profiles partner
          where lower(partner.role) = 'ayoub'
        ))
      )
  )
);

drop policy if exists "AYFAR pair can remove shared music" on public.ayfar_shared_music;
create policy "AYFAR pair can remove shared music"
on public.ayfar_shared_music for delete to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and (
        (lower(viewer.role) = 'ayoub' and exists (
          select 1 from public.profiles partner
          where lower(partner.role) in ('farahati','farhati')
        ))
        or
        (lower(viewer.role) in ('farahati','farhati') and exists (
          select 1 from public.profiles partner
          where lower(partner.role) = 'ayoub'
        ))
      )
  )
);

grant select, insert, delete on public.ayfar_shared_music to authenticated;

create or replace function public.ayfar_routine_touch_updated_at()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at=now(); return new; end; $$;

drop trigger if exists ayfar_routine_status_updated_at on public.ayfar_routine_status;
create trigger ayfar_routine_status_updated_at
before update on public.ayfar_routine_status
for each row execute function public.ayfar_routine_touch_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_routine_status'
  ) then
    alter publication supabase_realtime add table public.ayfar_routine_status;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='ayfar_shared_music'
  ) then
    alter publication supabase_realtime add table public.ayfar_shared_music;
  end if;
end $$;
