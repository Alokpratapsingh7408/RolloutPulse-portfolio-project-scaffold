# BACKEND.md — Database & Backend Requirements

Security details (RLS policy SQL, key handling) live in `SECURITY.md` — this doc is schema, realtime config, and data scripts.

## 1. Schema (full SQL)

```sql
create extension if not exists pgcrypto;

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
create index on batch_devices (batch_id, status);  -- powers the live progress counts

create table rollout_events (
  id              uuid primary key default gen_random_uuid(),
  batch_device_id uuid not null references batch_devices(id) on delete cascade,
  old_status      text,
  new_status      text not null,
  changed_at      timestamptz not null default now()
);
create index on rollout_events (batch_device_id);
```

`created_at` / `updated_at` as `timestamptz` throughout (never bare `timestamp`) — a small detail, but a real one worth getting right and mentioning.

## 2. Realtime configuration

Supabase Realtime only streams changes for tables added to the `supabase_realtime` publication:

```sql
alter publication supabase_realtime add table batch_devices;
alter publication supabase_realtime add table batches;
```

Client subscribes per batch:

```ts
supabase
  .channel(`batch-${batchId}`)
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'batch_devices', filter: `batch_id=eq.${batchId}` },
      (payload) => handleDeviceStatusChange(payload.new))
  .subscribe();
```

## 3. Migrations

Use the Supabase CLI migration workflow, not ad-hoc SQL run through the dashboard, so the schema is versioned in the repo:

```
supabase migration new init_schema
# paste the SQL above into the generated file
supabase db push
```

This also gives you a legitimate "how do you version your database schema" answer.

## 4. Seed script

`supabase/seed.sql` (or a `scripts/seed.ts` using `@supabase/supabase-js` with the service role key, run once locally):

- 3 rollouts (`active`, `completed`, `draft`).
- 4–6 batches per rollout, `sequence_order` 1..n.
- 50–500 devices total, reused across batches (a device's `serial` like `DEV-00042`, `model` from a small fixed list, `region` from `['north','south','east','west']`).
- One `batch_devices` row per (batch, device) assignment, all starting at `status = 'pending'`.

## 5. Simulation script (`scripts/simulate-rollout.ts`)

Pseudocode:

```
pick a rollout with status = 'active'
for each batch in that rollout, ordered by sequence_order:
  mark batch.status = 'in_progress', batch.started_at = now()
  for each batch_device row in that batch (shuffled order):
    wait a random delay (e.g. 100–800ms) — simulates real rollout pacing
    set batch_device.status = 'in_progress'
    wait again
    outcome = random() < 0.9 ? 'success' : 'failed'
    update batch_device.status = outcome
    insert into rollout_events (batch_device_id, old_status, new_status)
    increment batch.success_count / batch.failed_count accordingly
  mark batch.status = 'completed', batch.completed_at = now()
mark rollout.status = 'completed'
```

Run with `npx tsx scripts/simulate-rollout.ts` (from `backend/`) in a second terminal while the app is open — that's your live demo. State plainly in the README that this is a simulator standing in for a real device/agent reporting status back.
