---
name: Supabase service key env var workaround
description: Replit secret SUPABASE_SERVICE_ROLE_KEY doesn't propagate to already-running workflow processes; workaround is SUPABASE_SVC_KEY in .env.local
---

# Supabase Service Role Key Propagation Issue

## The Rule
Use `SUPABASE_SVC_KEY` (in `.env.local`) as the primary source for the service role key, with `SUPABASE_SERVICE_ROLE_KEY` as a fallback. Code in `lib/supabase/server.ts`:
```ts
const key = process.env.SUPABASE_SVC_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

**Why:** Replit secrets (registered via `requestEnvVar`) update the vault but the change does NOT propagate to already-running workflow processes or the shell session — the old value remains baked into the process environment. `.env.local` values ARE loaded fresh on each Next.js dev server startup, but Next.js won't override a process-env secret with `.env.local` for the same key name. Using a different key name (`SUPABASE_SVC_KEY`) in `.env.local` sidesteps this.

**How to apply:** Any time the service role key needs to change (new Supabase project, rotated key), write the new value to `artifacts/rita/.env.local` under `SUPABASE_SVC_KEY=...` and restart the workflow. The `createServiceClient()` function already prefers `SUPABASE_SVC_KEY` over `SUPABASE_SERVICE_ROLE_KEY`.
