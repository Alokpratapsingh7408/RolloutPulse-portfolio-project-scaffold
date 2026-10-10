# DESIGN.md — Architecture & System Design

See `PROJECT_PLAN.md` for the framing note on how to talk about this project. Keep "rollout" (not "campaign") everywhere.

## 1. High-level architecture

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
                                     │ scripts/          │
                                     │ simulate-rollout.ts│
                                     │ (run on your machine)│
                                     └──────────────────┘
```

**Key point:** the simulator is the only thing with write access (via the `service_role` key, kept in a local `.env`, never committed, never shipped to the browser). The browser only ever holds the `anon` key, and Postgres RLS decides what it's allowed to see or do with it.

## 2. Data flow

**Read path:** Page mounts → RTK Query endpoint fires → Supabase client runs a `select` (subject to RLS) → data cached in the Redux store → component renders from cache.

**Realtime path:** `simulate-rollout.ts` updates a row in `batch_devices` → Postgres emits a logical-replication event → Supabase Realtime forwards it over the open WebSocket to any subscribed client → `useRealtimeBatchDevices` hook receives the payload → calls `api.util.updateQueryData(...)` to patch the RTK Query cache directly (no refetch) → React re-renders just the changed row.

This two-path split (ordinary reads via RTK Query, live changes via a separate realtime patch) is the one piece of architecture worth being able to draw on a whiteboard — it's the actual answer to "how does the live update work."

## 3. Entity relationships

```
rollouts (1) ──< (many) batches (1) ──< (many) batch_devices >── (many) (1) devices
                                              │
                                              └──< (many) rollout_events
```

- A **rollout** has many **batches** (sequenced — `sequence_order`).
- A **batch** has many **batch_devices** rows — one per device assigned to that batch.
- A **device** can appear in `batch_devices` for different batches/rollouts over time (not unique to one batch).
- A **batch_device** status change writes a **rollout_event** row (audit trail / activity feed source).

Full column-level schema lives in `BACKEND.md`.

## 4. Page map

```
/login
  └─► /                     (Dashboard: rollout list)
         └─► /rollouts/:id  (batch list for one rollout)
                └─► /batches/:id  (device table for one batch, live-updating)
```

No deep nesting beyond 3 levels — keeps routing and breadcrumbs simple.

## 5. Design principles for this project

1. **Patch, don't refetch.** Realtime events update the cache in place; a busy batch with hundreds of devices must never trigger hundreds of full refetches.
2. **Accessible by default, not bolted on.** Every component in `FRONTEND.md` lists its ARIA/keyboard behavior as part of the spec, not an afterthought pass.
3. **RLS is the real security boundary**, not frontend logic. See `SECURITY.md`.
4. **Generic terminology.** Rollout / batch / device — never anything automotive-specific, per the framing note in `PROJECT_PLAN.md`.
5. **Small, honest scope.** No e2e tests, no multi-tenant orgs, no notification emails. Cutting these is a deliberate, statable decision (see `TESTING.md`), not an oversight.

## 6. Repo layout

Split into `frontend/` (the Vite app) and `backend/` (Supabase migrations, seed, and the simulation script) for a clearer monorepo boundary. Supabase itself is still the managed backend (Postgres + Realtime + Auth + RLS) — `backend/` just holds the SQL/scripts that configure and drive it, not a running server.

```
rollout-pulse/
├── docs/                     # this folder
├── backend/
│   ├── supabase/
│   │   ├── migrations/       # SQL migration files (Supabase CLI)
│   │   └── seed.sql          # or seed.ts
│   └── scripts/
│       └── simulate-rollout.ts
├── frontend/
│   ├── src/
│   │   ├── components/       # shared component library
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/            # Redux store + RTK Query api slice
│   │   ├── lib/supabase.ts    # Supabase client singleton
│   │   └── types/             # generated + hand-written types
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── .github/workflows/ci.yml
└── README.md
```
