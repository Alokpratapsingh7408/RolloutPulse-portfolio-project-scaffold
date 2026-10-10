# TESTING.md — Test Strategy

## 1. Scope decision (state this up front, it's a feature not a gap)

Given a 15-day solo build, testing is scoped to **unit + component tests only** — no end-to-end tests (Playwright/Cypress). This is a deliberate trade-off: e2e tests would mostly re-verify Supabase's own realtime guarantees, which isn't where the engineering risk is. The risk is in the frontend logic (cache patching, filtering, accessibility), so that's where the tests go.

## 2. What gets tested

| Test | What it checks |
|---|---|
| `StatusPill.test.tsx` | Renders correct text + icon + color class for each of the 4 statuses |
| `FilterBar.test.tsx` | Typing in search calls `onChange` with the debounced value; selecting a status filter calls `onChange` with the right value |
| `DataTable.test.tsx` | Sort toggles ascending/descending on header click; empty `rows` renders the empty state |
| `useRealtimeBatchDevices.test.ts` | Given a mocked Supabase channel emitting a `postgres_changes` payload, the RTK Query cache for `getBatchDevices` is patched with the new status (not refetched) |

## 3. Mocking Supabase

Don't hit a real Supabase project in tests. Two options:
- Mock `src/lib/supabase.ts` entirely with `jest.mock`, returning a fake client whose `.channel().on().subscribe()` chain you control in the test to fire a synthetic payload.
- For query tests, mock the `supabaseBaseQuery` function directly so RTK Query endpoint tests don't need network access at all.

## 4. Running tests

- `npm test` → Jest, runs all `*.test.tsx`/`*.test.ts` files.
- CI (`.github/workflows/ci.yml`) runs `npm run lint && npm test` on every PR — failing either blocks merge (see `DEPLOYMENT.md`).

## 5. If there's extra time

Consider `@axe-core/react` wired into the dev build to flag accessibility regressions automatically — a nice, cheap addition that directly backs the accessibility section of `FRONTEND.md`.
