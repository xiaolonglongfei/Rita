---
name: Supabase URL normalizer
description: Why getSupabaseUrl() exists and must be used everywhere including middleware
---

**Why:** NEXT_PUBLIC_SUPABASE_URL may have `/rest/v1` or trailing slash appended by the user, causing all PostgREST calls to fail. The @supabase/supabase-js client itself appends `/rest/v1`, so if the URL already has it the path becomes `/rest/v1/rest/v1/`.

**How to apply:** Import `getSupabaseUrl()` from `@/lib/supabase/url` in EVERY place that creates a Supabase client — including `middleware.ts`, `server.ts`, and `client.ts`. Never use `process.env.NEXT_PUBLIC_SUPABASE_URL` directly.

The normalizer uses `new URL(raw).origin` to strip any path suffix.
