# Rita

Rita is an instructor review and ranking platform where serious athletes find and vet instructors they can trust — data-driven, multi-dimensional reviews with Kemeny-Young personalized rankings.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/rita run dev` — run the Rita frontend (port 24211)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter routing + TanStack Query + Recharts
- API: Express 5 + express-session + connect-pg-simple
- Auth: Cookie sessions with bcryptjs password hashing
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/` — users, instructors, sessions, reviews, notifications
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- API routes: `artifacts/api-server/src/routes/` — auth, instructors, sessions, reviews, rankings, notifications, dashboard, admin
- Frontend pages: `artifacts/rita/src/pages/`

## Architecture decisions

- Session-based auth via express-session + connect-pg-simple (stores sessions in Postgres)
- Multi-dimensional reviews (technique, communication, patience, adaptability, expertise) with computed `overall_score`
- Instructor stats (`avg_score`, `review_count`) are cached columns recomputed after each moderation action via `recomputeInstructorStats()`
- Private rankings blend personal scores (70%) + global scores (30%) for reviewed instructors; global score at 50% weight for unreviewed instructors
- Reviews enter as `pending` and must be admin-approved before affecting instructor stats

## Product

- **Guest**: Browse instructors with search/filter, view profiles with score breakdowns and radar charts, see public rankings
- **Signed-in user**: Log sessions, submit multi-dimensional reviews, view personalized rankings, manage profile, receive notifications
- **Admin**: Manage instructors, moderate review queue (approve/reject), manage user admin privileges

## Seed Accounts

| Email | Password | Role |
|---|---|---|
| admin@rita.app | password123 | Admin |
| alex@example.com | password123 | User |
| maria@example.com | password123 | User |

## Gotchas

- After any schema change: `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- After any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen` then restart API server
- `recomputeInstructorStats()` in `routes/instructors.ts` must be called after review approval/rejection
- The CORS config uses `credentials: true` — frontend must use `credentials: 'include'` on fetch calls (handled by the custom-fetch in `@workspace/api-client-react`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
