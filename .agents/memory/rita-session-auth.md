---
name: Rita session auth
description: Cookie session auth setup for Rita — express-session + connect-pg-simple, bcryptjs passwords
---

## Rule
Rita uses express-session stored in Postgres via connect-pg-simple. Frontend must send `credentials: 'include'` on all API calls or the session cookie won't be sent.

**Why:** Supabase auth was swapped for a simpler cookie-session approach to avoid external dependencies. The `SESSION_SECRET` env var is already set as a Replit secret.

**How to apply:** The custom-fetch in `lib/api-client-react/src/custom-fetch.ts` must have `credentials: 'include'`. The `connect-pg-simple` store creates a `session` table automatically (`createTableIfMissing: true`).
