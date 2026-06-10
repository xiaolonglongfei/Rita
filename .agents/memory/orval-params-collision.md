---
name: Orval query+path param TS2308 collision
description: Endpoints with both path params AND query params cause GetXxxParams to be exported twice, causing TS2308
---

## Rule
When an OpenAPI endpoint has BOTH path params (e.g. `{id}`) AND query params (e.g. `page`, `limit`), Orval generates `GetXxxParams` in both `generated/api.ts` (as a Zod schema) AND `generated/types/` (as a TypeScript interface). The `lib/api-zod` barrel re-exports both with `export *`, causing TS2308.

**Why:** Orval uses the operationId to name both the path-param Zod schema and the query-param TypeScript type with the same name.

**How to apply:** Remove query params from endpoints that also have path params, OR restructure to use only path params. The collision is reproducible every time you combine path + query params on a single endpoint.
