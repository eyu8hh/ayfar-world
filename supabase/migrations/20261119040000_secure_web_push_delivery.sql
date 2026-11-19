-- AYFAR WORLD · secure browser push subscriptions and background delivery
-- Additive only. Existing notifications, roles, auth, and data remain unchanged.

create extension if not exists pg_net with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.ayfar_push_settings (
  id smallint primary key check (id = 1),
  webhook_secret_id uuid not null,
  vapid_public_secret_id uuid,
  vapid_private_secret_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
revoke all on private.ayfar_push_settings from public, anon, authenticated;
grant select, insert, update on private.ayfar_push_settings to service_role;

do $$
begin
  if not exists (select 1 from private.ayfar_push_settings where id = 1) then
    insert into private.ayfar_push_settings(id, webhook_secret_id)
    values (
      1,
      vault.create_secret(
        encode(extensions.gen_random_bytes(32), 'hex'),
        'ayfar_push_webhook_secret',
        'HMAC key used only to authenticate notification insert webhooks'
      )
    );
  end if;
end
$$;

create table if not exists public.ayfar_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 2048),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 200),
  user_agent text not null default '' check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ayfar_push_subscriptions_user_idx
  on public.ayfar_push_subscriptions(user_id, updated_at desc);
alter table public.ayfar_push_subscriptions enable row level security;

drop policy if exists "AYFAR users read own push subscriptions" on public.ayfar_push_subscriptions;
create policy "AYFAR users read own push subscriptions"
  on public.ayfar_push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "AYFAR users add own push subscriptions" on public.ayfar_push_subscriptions;
create policy "AYFAR users add own push subscriptions"
  on public.ayfar_push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "AYFAR users update own push subscriptions" on public.ayfar_push_subscriptions;
create policy "AYFAR users update own push subscriptions"
  on public.ayfar_push_subscriptions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "AYFAR users delete own push subscriptions" on public.ayfar_push_subscriptions;
create policy "AYFAR users delete own push subscriptions"
  on public.ayfar_push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.ayfar_push_subscriptions to authenticated;

create or replace function public.ayfar_push_get_config()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, private, vault, auth
as $$
declare
  result jsonb;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'webhook_secret', webhook.decrypted_secret,
    'vapid_public_key', public_key.decrypted_secret,
    'vapid_private_key', private_key.decrypted_secret
  )
  into result
  from private.ayfar_push_settings s
  left join vault.decrypted_secrets webhook on webhook.id = s.webhook_secret_id
  left join vault.decrypted_secrets public_key on public_key.id = s.vapid_public_secret_id
  left join vault.decrypted_secrets private_key on private_key.id = s.vapid_private_secret_id
  where s.id = 1;

  return result;
end
$$;
revoke all on function public.ayfar_push_get_config() from public, anon, authenticated;
grant execute on function public.ayfar_push_get_config() to service_role;

create or replace function public.ayfar_push_save_vapid_keys(p_public_key text, p_private_key text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, private, vault, auth
as $$
declare
  public_id uuid;
  private_id uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_public_key is null or char_length(p_public_key) not between 60 and 120
     or p_private_key is null or char_length(p_private_key) not between 30 and 100 then
    raise exception 'invalid VAPID key material';
  end if;

  perform 1 from private.ayfar_push_settings where id = 1 for update;
  select vapid_public_secret_id, vapid_private_secret_id
    into public_id, private_id
    from private.ayfar_push_settings where id = 1;

  if public_id is null then
    public_id := vault.create_secret(p_public_key, 'ayfar_push_vapid_public', 'Public Web Push VAPID key');
  else
    perform vault.update_secret(public_id, p_public_key);
  end if;

  if private_id is null then
    private_id := vault.create_secret(p_private_key, 'ayfar_push_vapid_private', 'Private Web Push VAPID key');
  else
    perform vault.update_secret(private_id, p_private_key);
  end if;

  update private.ayfar_push_settings
  set vapid_public_secret_id = public_id,
      vapid_private_secret_id = private_id,
      updated_at = now()
  where id = 1;

  return p_public_key;
end
$$;
revoke all on function public.ayfar_push_save_vapid_keys(text, text) from public, anon, authenticated;
grant execute on function public.ayfar_push_save_vapid_keys(text, text) to service_role;

create or replace function private.ayfar_enqueue_push_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, vault, extensions, net
as $$
declare
  webhook_secret text;
  payload jsonb;
  sent_at text;
  signature text;
begin
  select secret.decrypted_secret into webhook_secret
  from private.ayfar_push_settings settings
  join vault.decrypted_secrets secret on secret.id = settings.webhook_secret_id
  where settings.id = 1;

  if webhook_secret is null then
    return new;
  end if;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'ayfar_notifications',
    'schema', 'public',
    'record', to_jsonb(new),
    'old_record', null
  );
  sent_at := extract(epoch from clock_timestamp())::bigint::text;
  signature := encode(
    extensions.hmac(
      convert_to(sent_at || '.' || payload::text, 'UTF8'),
      convert_to(webhook_secret, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  begin
    perform net.http_post(
      url := 'https://zweughbuocvrytanqdzk.supabase.co/functions/v1/ayfar-push',
      body := payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_hPnXuYCKVqjC7iopD691JQ_7yPpdLJ3',
        'x-ayfar-timestamp', sent_at,
        'x-ayfar-signature', signature
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    -- Push delivery must never block or roll back the existing in-app notification.
    raise warning 'AYFAR push enqueue failed: %', SQLERRM;
  end;

  return new;
end
$$;
revoke all on function private.ayfar_enqueue_push_notification() from public, anon, authenticated;

drop trigger if exists ayfar_notifications_push_insert on public.ayfar_notifications;
create trigger ayfar_notifications_push_insert
  after insert on public.ayfar_notifications
  for each row execute function private.ayfar_enqueue_push_notification();

-- New private-message alerts use sender/recipient labels only; message text is never copied
-- into the notification center or lock-screen payload.
create or replace function public.ayfar_notify_private_message()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  sender_role text;
  sender_label text;
begin
  select lower(role) into sender_role
  from public.profiles where id = new.sender_id;

  if coalesce(sender_role, '') not in ('ayoub', 'farhati', 'farahati') then
    return new;
  end if;

  sender_label := case when sender_role = 'ayoub' then 'أيوب 🌙' else 'فرحتي 🌸' end;
  perform public.ayfar_send_notification(
    new.sender_id,
    new.recipient_id,
    'private_message',
    'رسالة جديدة من ' || sender_label,
    'وصلتك رسالة خاصة. افتح عالمكما لقراءتها.',
    new.id
  );
  return new;
end
$$;
revoke all on function public.ayfar_notify_private_message() from public, anon, authenticated;
drop trigger if exists ayfar_private_message_notify on public.private_messages;
create trigger ayfar_private_message_notify
  after insert on public.private_messages
  for each row execute function public.ayfar_notify_private_message();

-- A new daily letter alerts Farahati without exposing the letter text on the lock screen.
create or replace function public.ayfar_notify_love_letter()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  partner_id uuid;
begin
  select lower(role) into actor_role
  from public.profiles where id = actor_id;

  if coalesce(actor_role, '') <> 'ayoub' then
    return new;
  end if;

  partner_id := public.ayfar_partner_user_id(actor_id);
  perform public.ayfar_send_notification(
    actor_id,
    partner_id,
    'love_letter',
    'رسالة يومية جديدة من أيوب 🌙',
    'هناك رسالة جديدة داخل المغلف. افتح عالمكما لقراءتها.',
    new.id
  );
  return new;
end
$$;
revoke all on function public.ayfar_notify_love_letter() from public, anon, authenticated;
drop trigger if exists ayfar_love_letter_notify on public.love_letters;
create trigger ayfar_love_letter_notify
  after insert on public.love_letters
  for each row execute function public.ayfar_notify_love_letter();
