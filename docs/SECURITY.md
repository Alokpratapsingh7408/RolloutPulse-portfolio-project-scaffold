# SECURITY.md — Security & Access Control

## 1. Key handling (the one rule that matters most)

| Key | Where it lives | Can do |
|---|---|---|
| `anon` key | `.env` → `VITE_SUPABASE_ANON_KEY`, shipped to the browser | Only what RLS allows — nothing more |
| `service_role` key | Local-only `.env`, **never committed, never in frontend code** | Bypasses RLS entirely — used only by `scripts/simulate-rollout.ts` run on your own machine |

`.env` is git-ignored; `.env.example` (committed) lists the variable names with blank/placeholder values so anyone cloning the repo knows what to set.

## 2. Row-Level Security — enable + policies

```sql
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
-- repeat the same "admin write X" pattern for batches / devices / batch_devices
```

The frontend never needs write policies for most tables in this demo (the simulator writes via `service_role`, bypassing RLS by design) — but writing the admin policies anyway and stating that explicitly is the right habit, and a good thing to point out: "the frontend is read-only against these tables; the write path for this demo is a deliberately separate, offline process, which is exactly the kind of boundary you'd want between a UI and whatever system actually drives rollout execution."

## 3. Auth

- Supabase Auth, email/password (magic link is a fine alternative, pick one and be consistent).
- Session stored by `supabase-js` (handles refresh automatically); a simple `<ProtectedRoute>` wrapper checks `supabase.auth.getSession()` and redirects to `/login` if absent.
- No password reset flow needed for a portfolio project — note it as explicitly out of scope rather than silently missing.

## 4. Other standard considerations (brief, but know these)

- **Injection:** the Supabase JS client parameterizes queries by default — no raw string-concatenated SQL anywhere in the app.
- **XSS:** React escapes rendered text by default; the project has zero `dangerouslySetInnerHTML` calls — say this plainly if asked.
- **Secrets in CI:** if GitHub Actions ever needs a Supabase key (it shouldn't, for lint/test), it goes in GitHub Actions secrets, never in the workflow YAML.

## 5. What's explicitly out of scope (say this, don't hide it)

- Multi-tenant organizations/teams.
- Rate limiting / abuse protection on writes (irrelevant here since the frontend has no write path).
- Full audit-log tamper-proofing.

Stating scope boundaries clearly is itself a security-maturity signal — it's the difference between "I didn't think about it" and "I thought about it and here's why it's out of scope for a demo."
