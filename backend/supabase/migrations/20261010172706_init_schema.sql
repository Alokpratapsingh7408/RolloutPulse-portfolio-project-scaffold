-- RolloutPulse — initial schema, RLS policies, and realtime publication
-- See docs/BACKEND.md and docs/SECURITY.md for the full spec this implements.

create extension if not exists pgcrypto;

-- 1. Schema -------------------------------------------------------------

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

create table rollouts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  status      text not null default 'draft' check (status in ('draft','active','completed','paused')),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table batches (
  id             uuid primary key default gen_random_uuid(),
  rollout_id     uuid not null references rollouts(id) on delete cascade,
  name           text not null,
  sequence_order int not null,
  status         text not null default 'pending' check (status in ('pending','in_progress','completed','failed')),
  target_count   int not null default 0,
  success_count  int not null default 0,
  failed_count   int not null default 0,
  started_at     timestamptz,
  completed_at   timestamptz
);
create index on batches (rollout_id);

create table devices (
  id         uuid primary key default gen_random_uuid(),
  serial     text unique not null,
  model      text,
  region     text,
  created_at timestamptz not null default now()
);

create table batch_devices (
  id         uuid primary key default gen_random_uuid(),
  batch_id   uuid not null references batches(id) on delete cascade,
  device_id  uuid not null references devices(id),
  status     text not null default 'pending' check (status in ('pending','in_progress','success','failed')),
  updated_at timestamptz not null default now(),
  unique (batch_id, device_id)
);
create index on batch_devices (batch_id);
create index on batch_devices (batch_id, status);

create table rollout_events (
  id              uuid primary key default gen_random_uuid(),
  batch_device_id uuid not null references batch_devices(id) on delete cascade,
  old_status      text,
  new_status      text not null,
  changed_at      timestamptz not null default now()
);
create index on rollout_events (batch_device_id);

-- 2. Row-Level Security ---------------------------------------------------

alter table profiles      enable row level security;
alter table rollouts      enable row level security;
alter table batches       enable row level security;
alter table devices       enable row level security;
alter table batch_devices enable row level security;
alter table rollout_events enable row level security;

-- profiles: a user manages only their own row
create policy "read own profile" on profiles
  for select using (auth.uid() = id);
create policy "update own profile" on profiles
  for update using (auth.uid() = id);

-- everything else: any authenticated user can read
create policy "authenticated read rollouts" on rollouts
  for select using (auth.role() = 'authenticated');
create policy "authenticated read batches" on batches
  for select using (auth.role() = 'authenticated');
create policy "authenticated read devices" on devices
  for select using (auth.role() = 'authenticated');
create policy "authenticated read batch_devices" on batch_devices
  for select using (auth.role() = 'authenticated');
create policy "authenticated read rollout_events" on rollout_events
  for select using (auth.role() = 'authenticated');

-- writes restricted to admin role (checked via profiles table)
create policy "admin write rollouts" on rollouts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "admin write batches" on batches
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "admin write devices" on devices
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "admin write batch_devices" on batch_devices
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Realtime -------------------------------------------------------------

alter publication supabase_realtime add table batch_devices;
alter publication supabase_realtime add table batches;
