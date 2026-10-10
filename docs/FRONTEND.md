# FRONTEND.md — Frontend Requirements

## 1. Routing (`react-router-dom`)

| Route | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | redirect to `/` if already authed |
| `/` | `DashboardPage` (rollout list) | requires session |
| `/rollouts/:id` | `RolloutDetailPage` (batch list) | requires session |
| `/batches/:id` | `BatchDetailPage` (device table) | requires session |

Unauthenticated access to any protected route redirects to `/login`.

## 2. Component library

Every component below gets a one-line prop table and its accessibility behavior **written down before it's coded** — that's what turns "I used some components" into "I built a documented component library."

| Component | Key props | States | Accessibility notes |
|---|---|---|---|
| `Button` | `variant` ('primary'/'secondary'/'danger'), `onClick`, `disabled`, `isLoading` | default / hover / focus / disabled / loading | visible focus ring; `aria-busy` when loading |
| `StatusPill` | `status` ('pending'/'in_progress'/'success'/'failed') | one per status | icon **+** text label, never color alone; each status has a 4.5:1-contrast-minimum color pair |
| `DataTable` | `columns`, `rows`, `onSort`, `isLoading` | loading (skeleton rows) / empty / populated | `<th scope="col">`, sortable headers are real `<button>`s (keyboard-operable), not `onClick` divs |
| `FilterBar` | `statusFilter`, `searchValue`, `onChange` | — | labeled inputs (`<label for>`), debounced search (300ms) |
| `ProgressBar` | `value`, `max`, `label` | — | `role="progressbar"` with `aria-valuenow/min/max`, visible numeric label (not just a bar) |
| `Modal` | `isOpen`, `onClose`, `title` | open / closed | focus trap, `Esc` closes, focus returns to the trigger element on close |
| `EmptyState` | `message`, `action?` | — | — |
| `Skeleton` | `rows` | — | `aria-hidden="true"` (decorative, real content announced separately) |

## 3. Pages

**DashboardPage** — `useGetRolloutsQuery()`. Table/grid of rollouts: name, status pill, overall progress bar (sum of batch progress). Empty state if no rollouts.

**RolloutDetailPage** — `useGetBatchesByRolloutQuery(id)`. List of batches in `sequence_order`: name, status pill, progress bar, success/fail counts. Click → `/batches/:id`.

**BatchDetailPage** — `useGetBatchDevicesQuery(batchId)` + `useRealtimeBatchDevices(batchId)` (see `STATE_MANAGEMENT.md`). `DataTable` of devices with `FilterBar` above it (status filter, search by serial/model/region). This is the page where the live updates are visible — the `aria-live` region described in `DESIGN.md`/`SECURITY.md`'s accessibility notes sits here.

## 4. Responsive design

- Tailwind breakpoints, standard scale (`sm`/`md`/`lg`).
- Below `md`: `DataTable` switches to a stacked card-per-row layout (each card shows the same fields, just not in a grid) — a real, common pattern worth being able to explain, not just a media query that hides columns.

## 5. Styling conventions

- Status color tokens (define once, reuse everywhere — this is literally what a "design system" means):

| Status | Color | Icon |
|---|---|---|
| pending | gray | clock |
| in_progress | blue | spinner |
| success | green | check |
| failed | red | x |

- Tailwind config extends the default palette with these as named tokens (`status-pending`, etc.) rather than hardcoding hex values in components.

## 6. Folder structure (frontend-specific detail on top of `DESIGN.md`'s repo layout)

```
frontend/src/
├── components/
│   ├── Button.tsx
│   ├── StatusPill.tsx
│   ├── DataTable.tsx
│   ├── FilterBar.tsx
│   ├── ProgressBar.tsx
│   ├── Modal.tsx
│   ├── EmptyState.tsx
│   └── Skeleton.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── RolloutDetailPage.tsx
│   └── BatchDetailPage.tsx
├── hooks/
│   └── useRealtimeBatchDevices.ts
├── store/
│   ├── store.ts
│   └── api.ts            # RTK Query api slice
├── lib/
│   └── supabase.ts
└── types/
    └── database.ts        # generated via `supabase gen types typescript`
```
