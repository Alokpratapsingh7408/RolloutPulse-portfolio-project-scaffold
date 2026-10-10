# DEPLOYMENT.md — CI/CD & Deployment

## 1. Supabase project setup (one-time, manual)

1. Create a free Supabase project.
2. `supabase link` the local repo to it; `supabase db push` to apply migrations from `BACKEND.md`.
3. Run the RLS policies from `SECURITY.md` (as part of the same migration, or a follow-up one).
4. Add `batches` and `batch_devices` to the `supabase_realtime` publication (see `BACKEND.md` §2).
5. Enable email/password auth in the Supabase Auth settings; create one test user.
6. Copy the project URL + `anon` key into `.env` (frontend) and the `service_role` key into a separate local-only `.env` used only by `scripts/simulate-rollout.ts`.

## 2. Environment variables

```
# .env (frontend, committed as .env.example with blanks)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# .env (scripts only, never committed, not even as .example with a real shape beyond the name)
SUPABASE_SERVICE_ROLE_KEY=
```

## 3. GitHub Actions (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci
```

## 4. Vercel

- Connect the GitHub repo to a new Vercel project.
- Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel's project environment variables (same values as `.env`).
- Every push to `main` auto-deploys; PRs get preview deployments for free — worth mentioning, it's a nice real-world touch.

## 5. README checklist (the public-facing doc — this is what a recruiter/interviewer actually opens)

- [ ] One-paragraph description using the "Progressive Rollout / Canary Release Monitor" framing from `PROJECT_PLAN.md`.
- [ ] Live demo link + a login you can hand out (or a "request access" note).
- [ ] Architecture diagram (can reuse the one in `DESIGN.md`).
- [ ] Screenshot or short GIF of the live status updates in action.
- [ ] Setup instructions (clone, `npm install`, env vars, `supabase db push`, `npm run dev`).
- [ ] "What I'd do with more time" section — burst-handling for realtime, e2e tests, multi-tenant orgs. Mirrors the explicit scope calls in `TESTING.md`/`SECURITY.md`.
- [ ] No mention of Embitel/DLCM/VW anywhere in this file, ever.
