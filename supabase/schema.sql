-- ملف تأسيسي فقط، غير مطبق وغير كافٍ للإنتاج.
create table if not exists public.world_settings (id bigint generated always as identity primary key, anniversary date not null default date '2026-09-19', timezone text, created_at timestamptz not null default now());
