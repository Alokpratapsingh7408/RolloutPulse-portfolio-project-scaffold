# RolloutPulse — Project Plan & Requirements

> **How to talk about this project — read this before building, not after.**
> Publicly (GitHub repo name/description, README, resume bullet, and anything you say unprompted in an interview), this is a **"Progressive Rollout / Canary Release Monitor"** — a generic, well-known engineering pattern, not a copy of anyone's internal product. Never write or say "DLCM," "Embitel," "Volkswagen," or "vehicle fleet" anywhere public. The *why Embitel* reasoning below is private planning context for you and me only.
>
> If asked in an interview why you built it: "I wanted to get better at realtime dashboards with Supabase, and progressive rollout monitoring is a pattern I find interesting." That's true, and it costs you nothing. The one line you must never cross: never say a past employer or named client commissioned this — it didn't, it's your own project, and that's a completely normal thing to have.
>
> **Terminology note:** the top-level entity is called a **rollout** (not "campaign") throughout — "campaign" leans toward marketing/OTA-update jargon, "rollout" is the standard term in progressive-delivery/canary-release tooling (Argo Rollouts, feature-flag platforms). Keep this consistent in code, variable names, and conversation.

**What it is:** a realtime dashboard for monitoring progressive software rollouts across a fleet of devices — a rollout is broken into batches, batches contain devices, and each device's update status (pending → in progress → success/failed) updates live on screen without a page refresh.

**Why this project, for this role (private note):** Embitel's DLCM Control Center plans and monitors large-scale software rollout campaigns across a vehicle fleet — campaign creation, batch planning, rollout steering, live status monitoring. This project is the same *shape* of problem (rollouts → batches → live status), built with your real stack (React, TypeScript, Redux Toolkit, Supabase Realtime), as your own independent project — not a copy of anyone's internal system, and not claiming to be built for any company.

**Ground rule:** every requirement below only goes on your resume/in an interview once it's actually built and you've run it yourself. Nothing here is a resume bullet yet — it's a build spec.

## Doc index

This plan is the overview + timeline. Detailed specs live in their own files, written before any code so you build against a spec instead of improvising:

| Doc | Covers |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Architecture diagram, data flow, entity relationships, page map, repo layout |
| [`BACKEND.md`](./BACKEND.md) | Full Postgres schema (SQL), realtime config, migrations, seed + simulation scripts |
| [`FRONTEND.md`](./FRONTEND.md) | Routes, component library (props + a11y per component), page breakdowns, styling tokens |
| [`STATE_MANAGEMENT.md`](./STATE_MANAGEMENT.md) | RTK Query setup, the Supabase-realtime-to-cache-patch pattern, loading/error conventions |
| [`SECURITY.md`](./SECURITY.md) | RLS policies (full SQL), key handling, auth, explicit out-of-scope items |
| [`TESTING.md`](./TESTING.md) | What's tested and why, what's deliberately not (and why that's fine to say) |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Supabase project setup, env vars, GitHub Actions, Vercel, the public README checklist |

Read `DESIGN.md` first — everything else builds on the architecture and schema defined there.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Matches your resume stack exactly |
| Styling | Tailwind CSS | Already on your resume, fast to build with |
| State / data | Redux Toolkit + RTK Query | You already list this — this project backs it with a real, non-trivial use (wrapping Supabase + realtime cache updates) |
| Backend | Supabase (Postgres + Realtime + Auth + Row-Level Security) | Matches your real prior experience (the Saudi-client dashboard) |
| Testing | Jest + React Testing Library | Already on your resume |
| CI/CD | GitHub Actions | Already on your resume |
| Hosting | Vercel (frontend) + Supabase Cloud (backend, free tier) | Free, fast to set up, gives you a live demo link |

---

## 2. Backend Requirements (Supabase / Postgres)

### 2.1 Data model

```
profiles
  id            uuid (references auth.users, PK)
  full_name     text
  role          text  -- 'admin' | 'viewer'

rollouts
  id            uuid PK, default gen_random_uuid()
  name          text not null
  description   text
  status        text  -- 'draft' | 'active' | 'completed' | 'paused'
  created_by    uuid references profiles(id)
  created_at    timestamptz default now()

batches
  id             uuid PK
  rollout_id     uuid references rollouts(id) on delete cascade
  name           text not null          -- e.g. "Batch 1 - Region West"
  sequence_order int not null
  status         text  -- 'pending' | 'in_progress' | 'completed' | 'failed'
  target_count   int not null
  success_count  int default 0
  failed_count   int default 0
  started_at     timestamptz
  completed_at   timestamptz

devices
  id          uuid PK
  serial      text unique not null
  model       text
  region      text
  created_at  timestamptz default now()

batch_devices                          -- join table: one row per device per batch
  id           uuid PK
  batch_id     uuid references batches(id) on delete cascade
  device_id    uuid references devices(id)
  status       text  -- 'pending' | 'in_progress' | 'success' | 'failed'
  updated_at   timestamptz default now()

rollout_events                          -- optional audit log, powers an activity feed
  id               uuid PK
  batch_device_id  uuid references batch_devices(id)
  old_status       text
  new_status       text
  changed_at       timestamptz default now()
```

### 2.2 Row-Level Security (RLS)

- `profiles`: a user can read/update only their own row.
- `rollouts`, `batches`, `devices`, `batch_devices`, `rollout_events`: any authenticated user can `SELECT` (single-tenant demo app); only `role = 'admin'` can `INSERT`/`UPDATE`/`DELETE`.
- **No `service_role` key ever ships to the frontend** — only the anon key, gated by RLS. This is the actual security story to tell in an interview.

### 2.3 Realtime

- Frontend subscribes to Postgres changes on `batch_devices` filtered by `batch_id`, and on `batches` (for the top-level progress bar), using `supabase.channel(...).on('postgres_changes', ...)`.
- A small **simulation script** (`backend/scripts/simulate-rollout.ts`, run locally with `npx tsx`) walks a batch's `batch_devices` rows from `pending` → `in_progress` → `success`/`failed` on a random delay (roughly 90% success / 10% failed), writing to `rollout_events` on each change. This is what makes the realtime UI update live during a demo — be upfront in the README that it's a simulator, not a real update mechanism.

### 2.4 Seed data

- Script to generate ~3 rollouts, 4–6 batches each, 50–500 devices per batch (to legitimately exercise "data-heavy").

---

## 3. Frontend Requirements

### 3.1 Pages / routes (`react-router-dom`)

| Route | Shows |
|---|---|
| `/login` | Supabase Auth email/password |
| `/` (Dashboard) | Rollout list — name, status, overall progress |
| `/rollouts/:id` | Batch list for a rollout — status, progress bar, success/fail counts per batch |
| `/batches/:id` | Device table for a batch — filterable, sortable, status column, live-updating |

### 3.2 Reusable component library (the "design system" the JD asks for)

- `Button`, `Badge` / `StatusPill` (color **+ icon/text**, not color alone — accessibility requirement), `DataTable` (sortable, paginated or virtualized), `FilterBar` (status filter + search by serial/model/region), `ProgressBar`, `Modal`, `EmptyState`, `Skeleton` loader.
- Document each component's props once (a short `COMPONENTS.md` or Storybook if there's time) — this is what lets you say "I built a shared component library," not just "I used components."

### 3.3 State management

- RTK Query API slice wrapping Supabase calls (`getRollouts`, `getBatches`, `getBatchDevices`).
- A custom hook `useRealtimeBatchDevices(batchId)` that subscribes to the Supabase channel and calls RTK Query's `updateQueryData` to patch the cache directly — this is a genuinely non-trivial, explainable piece of state management, not boilerplate.
- Explicit loading / error / empty states on every data view.

### 3.4 Accessibility (this is where your real WCAG audit experience plugs in directly)

- Semantic HTML (`<table>` with proper `<th scope="col">`, not div soup).
- `aria-live="polite"` region announcing status changes (e.g. "Batch 3: 42 of 100 devices updated") for screen-reader users watching a live view.
- Full keyboard navigation through the table and filters; visible focus states.
- Color contrast checked with axe DevTools or Lighthouse — status colors paired with text/icons, never color-only.

### 3.5 Responsive design

- Table collapses to a card layout under a breakpoint (common real pattern, and a legitimate talking point).

### 3.6 Testing

- Jest + RTL: `StatusBadge` renders correct text/color per status; `FilterBar` filters correctly; one test mocking the Supabase channel to verify `useRealtimeBatchDevices` updates the cache on a simulated event.

### 3.7 Non-functional

- Virtualize the device table (e.g. `@tanstack/react-virtual`) once a batch has hundreds of rows — ties directly to "data-heavy... applications" in the JD.
- Only the Supabase **anon** key in frontend env vars, RLS doing the real enforcement.
- GitHub Actions: lint + test on every PR; Vercel auto-deploys `main`.

---

## 4. 15-Day Build Plan

| Day | Deliverable | Definition of done |
|---|---|---|
| 1 | Vite + React + TS scaffold, Tailwind configured, repo on GitHub | `npm run dev` shows a blank styled page |
| 2 | Supabase project created; schema above applied via SQL migration; RLS policies written | Tables visible in Supabase dashboard; RLS blocks anon writes |
| 3 | Seed script run; Supabase Auth wired up (login page) | Can log in; rollouts show up in a `select *` query |
| 4 | RTK Query API slice for rollouts/batches/devices | Dashboard page lists real rollouts from Supabase |
| 5–6 | Component library: Button, Badge, DataTable, FilterBar, ProgressBar, Modal, EmptyState, Skeleton | Each component used at least once, props documented |
| 7 | Rollout list page + Rollout detail (batch list) wired to real data | Clicking a rollout shows its batches with progress bars |
| 8 | Batch detail page: device table with filters + search | Table shows devices, filters work client-side |
| 9 | Realtime: `useRealtimeBatchDevices` hook + Supabase channel subscription | Manually editing a row in Supabase Studio updates the UI live |
| 10 | `simulate-rollout.ts` script | Running it visibly flips device statuses in the UI in real time |
| 11 | Accessibility pass: aria-live region, keyboard nav, contrast check | Tab through the whole app with no mouse; axe DevTools shows 0 critical issues |
| 12 | Responsive pass: mobile card layout for the device table | App usable at 375px width |
| 13 | Jest + RTL tests (3–4 tests minimum) | `npm test` passes in CI |
| 14 | GitHub Actions (lint+test), Vercel deploy | PR triggers CI; `main` auto-deploys; live URL works |
| 15 | README (architecture, screenshots, "what I'd do with more time"), record a 2–3 min screen walkthrough for yourself | README complete; you can explain every file without notes |

---

## 5. Resume bullets — only add these once the thing is actually live

```
RolloutPulse – Realtime Progressive Rollout Monitor | React, TypeScript, Redux Toolkit, Supabase (Postgres + Realtime)
• Built a realtime dashboard tracking progressive software rollouts across simulated device batches,
  with live status updates via Supabase Realtime and RTK Query cache patching.
• Built a reusable, documented component library (tables, status badges, filters) with keyboard
  navigation, ARIA live regions, and contrast-checked status indicators.
• Set up CI/CD with GitHub Actions and Row-Level Security on all Supabase tables; deployed to Vercel.
```

## 6. Interview talking points to prepare once it's built

- Why RLS instead of trusting the frontend — what it actually enforces.
- Why RTK Query's `updateQueryData` instead of just refetching on every realtime event (avoids a full re-fetch storm on a busy batch).
- What breaks at scale (thousands of devices in one batch) and what you'd change (virtualization, pagination at the query level, debounced realtime batching).
- The aria-live region — why `polite` and not `assertive`, and what happens if 50 devices update in one second (you'll want to throttle the announcement, not literally read every single change).
- If asked "why this domain" — the honest answer in the box at the top of this doc. Practice saying it out loud once before the interview so it doesn't sound rehearsed.
