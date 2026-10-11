# RolloutPulse

A realtime dashboard for monitoring progressive software rollouts across a device fleet — a **Progressive Rollout / Canary Release Monitor**. A rollout is broken into batches, batches contain devices, and each device's update status (pending → in progress → success/failed) updates live on screen without a page refresh, powered by Supabase Realtime and an RTK Query cache-patching pattern.

**Live demo:** not yet deployed — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the planned Vercel/Supabase setup.

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│        Browser            │        │           Supabase              │
│  ┌─────────────────────┐  │        │  ┌──────────────┐  ┌─────────┐ │
│  │ React + TypeScript   │  │  HTTPS │  │  Postgres     │  │  Auth    │ │
│  │  - Pages              │◄─┼────────┼─►│  (RLS on)     │  │          │ │
│  │  - Component library  │  │        │  └──────┬───────┘  └─────────┘ │
│  │  - RTK Query (cache)  │  │        │         │                     │
│  └─────────▲────────────┘  │        │  ┌──────▼───────┐             │
│            │  WebSocket     │        │  │  Realtime     │             │
│            └────────────────┼────────┼─►│  (logical repl)│             │
└─────────────────────────┘        │  └──────────────┘             │
                                     └──────────────────────────────┘
                                              ▲
                                              │ writes (service_role, local only)
                                     ┌──────────────────┐
                                     │ backend/scripts/  │
                                     │ simulate-rollout.ts│
                                     │ (run on your machine)│
                                     └──────────────────┘
```

The simulator is the only thing with write access (via the Supabase `service_role` key, kept in a local `backend/.env`, never committed, never shipped to the browser). The browser only ever holds the `anon`/publishable key, and Postgres Row-Level Security decides what it's allowed to see or do with it.

**Read path:** page mounts → RTK Query endpoint fires → Supabase client runs a `select` (subject to RLS) → cached in the Redux store → component renders from cache.

**Realtime path:** `simulate-rollout.ts` updates a row in `batch_devices` → Postgres emits a logical-replication event → Supabase Realtime forwards it over an open WebSocket → `useRealtimeBatchDevices` patches the RTK Query cache directly via `api.util.updateQueryData` (no refetch) → React re-renders just the changed row. A batch with hundreds of devices updating in quick succession never triggers hundreds of full table refetches.

Full design notes, schema, and RLS policies: [docs/DESIGN.md](./docs/DESIGN.md), [docs/BACKEND.md](./docs/BACKEND.md), [docs/SECURITY.md](./docs/SECURITY.md).

## Repo layout

```
rollout-pulse/
├── docs/              # architecture, schema, security, testing, deployment specs
├── backend/
│   ├── supabase/       # SQL migrations (Supabase CLI)
│   └── scripts/        # seed.ts, simulate-rollout.ts
├── frontend/           # Vite + React + TypeScript app
└── .github/workflows/  # CI (lint + test)
```

## Setup

1. **Supabase project** — create a free project, then from `backend/`:
   ```
   npm install
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   Add `batches` and `batch_devices` to the `supabase_realtime` publication (handled by the migration), and enable email/password auth in the Supabase dashboard.

2. **Seed data** — copy `backend/.env.example` to `backend/.env`, fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API Keys — the `service_role`/secret key, never the publishable one), then:
   ```
   npx tsx scripts/seed.ts
   ```
   This creates 3 rollouts, 4-6 batches each, 500 devices, and a test login (`admin@rolloutpulse.test` / `RolloutPulse123!`).

3. **Frontend** — copy `frontend/.env.example` to `frontend/.env`, fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the publishable key — safe for the browser, RLS enforces access), then:
   ```
   cd frontend
   npm install
   npm run dev
   ```

4. **Watch it update live** — in a second terminal, from `backend/`:
   ```
   npx tsx scripts/simulate-rollout.ts
   ```
   This is a simulator standing in for real devices reporting status back — not a real update mechanism. Watch the batch detail page while it runs.

## Testing

`cd frontend && npm test` — Jest + React Testing Library. Scoped to unit/component tests (see [docs/TESTING.md](./docs/TESTING.md) for why e2e tests are a deliberate, stated trade-off rather than a gap): `StatusPill`, `FilterBar`, `DataTable`, and `useRealtimeBatchDevices` (verifies the realtime handler patches the RTK Query cache in place rather than refetching).

## What's explicitly out of scope

- End-to-end tests (Playwright/Cypress) — the risk here is in frontend logic (cache patching, filtering, accessibility), not re-verifying Supabase's own realtime guarantees.
- Multi-tenant organizations/teams.
- Password reset flow.
- Full audit-log tamper-proofing.
- **Device table virtualization.** The original plan called for virtualizing the device table (e.g. `@tanstack/react-virtual`) once a batch has hundreds of rows. With up to 500 plain DOM rows it renders without any visible jank, so I deferred it rather than rush a structural change — properly virtualizing an accessible `<table>` (keeping `<th scope="col">`, keyboard navigation, and the 0-violation axe result from the accessibility pass) typically means switching to a div/ARIA-role-based grid, which is more surgery than the current row counts justify.

## What I'd do with more time

- **Virtualize the device table** (see above) once batch sizes grow enough to need it, using an ARIA `role="table"`/`role="row"`/`role="cell"` grid so it stays keyboard- and screen-reader-accessible.
- **Burst-handling for realtime updates**: batch incoming `postgres_changes` payloads over a short window (e.g. 100ms) and apply them in one `updateQueryData` pass, instead of one dispatch per event — the naive per-event version is fine at today's volumes but wouldn't scale to many batches updating at once.
- **E2E tests** covering the full login → dashboard → rollout → batch flow.
- **Server-side pagination** for the device table as an alternative/complement to virtualization at very large row counts.
- **Multi-tenant orgs** so more than one team could use the same deployment.
