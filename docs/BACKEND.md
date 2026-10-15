# Backend (Phase 6) — conventions

How the server side is built. Read `AGENTS.md` and `docs/SCREENS.md` first.

## Principles

- **Promises on screen are enforced on the server.** Answers are independent (rule 7), failed or stopped answers cost nothing, and every credit is in the append-only ledger (rule 8).
- **Contracts first.** Every endpoint's request and response types live in `src/lib/contracts/` (Zod). Route handlers parse input with them, and the screens call them through `api()` from `src/lib/api-client.ts`. Change a contract additively; never fork types in a screen.
- **Every external service sits behind an adapter with a local stand-in**, chosen by environment (`src/lib/server/env.ts`). In development everything runs with no keys. Production refuses to start without the database, the auth secret, SMS and PayStation (`assertProductionEnv`).
- **Secrets stay on the server.** Only `src/lib/server/**`, `src/lib/db/**` and route handlers read `env`. They `import "server-only"`.

## Layout

```
src/lib/
  contracts/        Zod request/response types per domain (common, auth, chat, wallet, account)
  server/           env.ts, api.ts (route helpers, ApiError), users.ts
  db/               schema.ts, index.ts (getDb), testing.ts (useTestDb), seed/
  auth/             session.ts (cookie sessions), otp, sms adapters, google
  billing/          units.ts, ledger.ts (reserve / settle / creditPayment), pricing
  ai/               models.ts, providers, orchestrator, demo model
  payments/         paystation.ts, sandbox.ts, packs
  api-client.ts     typed fetch for the browser
src/app/api/        route handlers (outside [locale]; proxy.ts skips /api)
drizzle/            SQL migrations (generated; 0001 makes the ledger append-only)
```

## Database

- Postgres through Drizzle. With `DATABASE_URL` it connects to Postgres; without it, `getDb()` opens PGlite (embedded Postgres) in `.data/pglite` and applies `drizzle/` migrations itself.
- Change the schema in `src/lib/db/schema.ts`, then `npm run db:generate -- --name <what>`. Don't edit generated SQL; custom SQL goes in a `--custom` migration.
- Amounts are integers: credits in **millicredits** (1 cr = 1000 mcr), taka in **paisa**. Convert at the API edge with `src/lib/billing/units.ts`. 1 credit = BDT 0.01.

## Credits ledger

- Never update or delete `ledger_entries`; the database rejects it. Every write has an idempotency key.
- Answer: `reserve()` the estimate before calling the model → `settle()` with the actual cost when it ends (0 when failed or stopped).
- Payment: `creditPayment()` only after the provider confirms it server-side (webhook or status check), never from the browser's return page.
- Balance = sum of entries (`balanceMcr`).

## API routes

- `src/app/api/**/route.ts`, wrapped in `route(...)` from `src/lib/server/api.ts`. Throw `ApiError(status, code)`; codes are listed in `contracts/common.ts`.
- Authenticated routes call `requireUser()`; admin routes call `requireAdmin()`.
- Handlers run per request (they read cookies), which is fine with `cacheComponents`. Pages that need the user read it in a client component through the API, or in a server component inside `<Suspense>`.

## Tests

- Vitest, `// @vitest-environment node` at the top of server tests. `useTestDb()` gives each test file a fresh, migrated in-memory database.
- e2e (Playwright) runs against the dev server with the demo seed (`seedDemo`): the coffee-shop chat and 10,684 credits.

## Stand-ins (development)

| Service | Without keys |
| --- | --- |
| Postgres | PGlite in `.data/pglite` |
| SMS gateway | Code printed to the server log |
| Google sign-in | Button explains it isn't set up |
| AI providers | Scripted demo model per provider (streams, can time out or fail on cue) |
| PayStation | In-app sandbox checkout (approve / fail / cancel) |
| Image provider | Generated placeholder PNG |
