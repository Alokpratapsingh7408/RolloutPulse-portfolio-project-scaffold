# START_PROMPT.md — paste this to begin (or resume) the build

I'm building a small portfolio project called **RolloutPulse** — a realtime dashboard for monitoring progressive software rollouts across a device fleet. All planning is already done and lives in `docs/` in this repo (`C:\Alok's Projects\rollout-pulse`):

- `docs/PROJECT_PLAN.md` — overview, framing note, and the 15-day build plan (**read this first**, it's the index and links to everything below)
- `docs/DESIGN.md` — architecture diagram, data flow, entity relationships, repo layout
- `docs/BACKEND.md` — full Postgres schema (SQL), realtime config, seed + simulation scripts
- `docs/FRONTEND.md` — routes, component library spec (props/states/a11y per component), page breakdowns, styling tokens
- `docs/STATE_MANAGEMENT.md` — RTK Query setup + the Supabase-realtime-to-cache-patch pattern
- `docs/SECURITY.md` — RLS policies (full SQL), key handling, auth, explicit scope boundaries
- `docs/TESTING.md` — test strategy and what's deliberately out of scope
- `docs/DEPLOYMENT.md` — Supabase/GitHub Actions/Vercel setup, and the public README checklist

**Please read all of these before writing any code.**

## Rules

1. Follow the specs exactly — schema, component props, folder structure, naming. Don't improvise a different architecture; if something's missing or unclear, ask rather than guessing silently.
2. Use **"rollout"** terminology everywhere — code, comments, commit messages, UI copy. Never "campaign." (See the framing note at the top of `PROJECT_PLAN.md` for why.)
3. Work through `PROJECT_PLAN.md`'s 15-day table **in order**, a day (or small cluster of adjacent days) per session. Before starting, state which day(s) we're doing and that day's "Definition of Done" from the table; confirm it's actually met before moving on.
4. Commit to git after each day's work with a clear message (e.g. `"Day 3: seed script + Supabase Auth wired up"`).
5. Keep the `service_role` Supabase key out of everything except the local `scripts/simulate-rollout.ts` — never commit it, never put it in frontend code.

## Start here

Begin with **Day 1**: scaffold the Vite + React + TypeScript project, configure Tailwind, initialize git, and push the first commit. Confirm `npm run dev` renders a blank styled page before stopping.
