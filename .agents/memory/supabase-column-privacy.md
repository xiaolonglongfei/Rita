---
name: Supabase private column permissions
description: Row-level security and app response allowlists do not make newly added instructor columns private.
---

Do not assume a private column is protected because application DTOs omit it. Supabase browser roles can inherit table-level SELECT access to new columns on publicly readable instructor rows.

**Why:** Read-only anonymous checks against this project's Supabase API could select newly added admin-only source columns. Column-level REVOKE alone does not override a table-level SELECT grant.

**How to apply:** Verify both anonymous and authenticated column access, use explicit public projections, and have the founder apply reviewed column-permission SQL when necessary. Saving private source values must fail closed until both browser roles receive permission-denied responses. Preserve service-role server access and do not change existing data rows to enforce column privacy.
