-- AYFAR WORLD: private messages
-- Run this file in Supabase SQL Editor as project owner.
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint private_messages_distinct_users check (sender_id <> recipient_id)
);

create index if not exists private_messages_recipient_created_idx
  on public.private_messages (recipient_id, created_at desc);
create index if not exists private_messages_sender_created_idx
  on public.private_messages (sender_id, created_at desc);

alter table public.private_messages enable row level security;

drop policy if exists "participants can read their messages" on public.private_messages;
create policy "participants can read their messages"
on public.private_messages for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "ayoub can send to farahati" on public.private_messages;
create policy "ayoub can send to farahati"
on public.private_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ayoub')
  and exists (select 1 from public.profiles p where p.id = recipient_id and p.role = 'farahati')
);

-- No UPDATE or DELETE policy: neither participant can edit or erase a sent message.
-- Read receipts are intentionally omitted until a narrowly scoped secure RPC is added.
