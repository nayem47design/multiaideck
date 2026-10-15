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

## Sign-in and the signed-in user

- **Phone + SMS code** (`src/lib/auth/otp.ts`): 6 digits, stored only as an HMAC (keyed with `AUTH_SECRET`, bound to the phone), 5-minute expiry, only the newest code counts, compared in constant time. Limits: 60 s before another code, 5 codes per phone and 20 per IP per hour (429 `rate_limited`, `details.retryAfter` seconds and `limit`), 5 wrong tries kill a code, 10 wrong tries for a phone in an hour lock it for 30 minutes (423 `locked`). All counted from `otp_codes`; a lock is a marker row.
- **SMS** (`src/lib/auth/sms.ts`): `SMS_PROVIDER=console` prints the message to the server log (development only); `SMS_PROVIDER=http` posts to a BulkSMSBD-style form API (`api_key`, `senderid`, `number`, `message`) at `SMS_API_URL`. Another gateway is one more `SmsSender`. The text is `auth.sms.code` in the user's language (or the screen's, for a new number).
- **Google** (`src/lib/auth/google.ts`): authorization code flow with state + PKCE in a 10-minute httpOnly cookie scoped to `/api/auth/google`; the profile comes from Google's OpenID userinfo. Signs in by Google id, links to the signed-in user, or matches a *verified* email on both sides; never takes over an account by an unverified email. Without `GOOGLE_CLIENT_ID`/`SECRET`, `GET /api/auth/google?check=1` answers 503 and the sign-in screen says so. The OAuth redirect URI to register is `${APP_URL}/api/auth/google/callback`.
- **Sessions** (`src/lib/auth/session.ts`): a random token in the httpOnly, SameSite=Lax `mai_session` cookie (Secure in production); the database keeps its SHA-256. Verify starts a fresh session (and ends the browser's previous one). `GET /api/me` clears a cookie that no longer matches a session.
- **Route protection** (`src/proxy.ts`): optimistic only. No session cookie on an app page → `/{locale}/sign-in?next=<path>` (`next` is checked by `safeNext`: relative, same origin); a cookie on `/sign-in` → home. Route handlers always call `requireUser()`.
- **Accounts** (`src/lib/auth/account.ts`): `DELETE /api/me` soft-deletes (sets `deleted_at`, clears phone, email, Google id and password so they can sign up again, ends every session) and never touches the ledger. `GET /api/me/export` is the JSON download. Passwords use scrypt with a random salt (`src/lib/auth/password.ts`).
- **In the browser**: `useMe()` from `src/lib/me.tsx` → `{ user, balance, topUpLeft, chatCount, status, refresh, setBalance, setUser }`. `<MeProvider>` is mounted in the `(app)` and `(page)` layouts. After spending or paying, call `refresh()` or `setBalance(credits)`. A 401 sends the browser to sign-in.

### Development helpers (404 in production)

- `POST /api/dev/sign-in-demo` seeds the demo data and signs this browser in as the demo user (a new session each time). e2e uses it (`tests/e2e/auth.setup.ts`), and you can run it from the browser console: `fetch("/api/dev/sign-in-demo", { method: "POST" }).then(() => location.assign("/"))`.
- With `SMS_PROVIDER=console`, codes appear in the dev server log; `GET /api/dev/last-code?phone=17…` returns the last one (kept in memory only).

### Reset the local database

Stop the dev server (it owns `.data/pglite`), delete the folder, start it again: `rm -rf .data/pglite && npm run dev`. Migrations run on the first request; then `POST /api/dev/sign-in-demo` (or `/api/dev/seed`) brings the demo user back. Never open `.data/pglite` from a second process while the server runs.

### Production environment

`AUTH_SECRET` (32+ random characters), `APP_URL`, `SMS_PROVIDER=http` + `SMS_API_URL` + `SMS_API_KEY` (+ `SMS_SENDER_ID` if the gateway needs an approved sender), and for Google `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.

## Tests

- Vitest, `// @vitest-environment node` at the top of server tests. `useTestDb()` gives each test file a fresh, migrated in-memory database.
- e2e (Playwright) runs against the dev server with the demo seed (`seedDemo`): the coffee-shop chat and 10,684 credits. Every test starts signed in as the demo user (the `e2e-setup` project writes `playwright/.auth/demo.json`). A test that signs out, deletes an account or tests sign-in uses the helpers in `tests/e2e/auth.ts` (`signedOut`, `ownDemoSession`, `newPhoneUser`, `freshIp`, `lastCode`) so it never ends the shared session or hits the per-IP limit.

## Stand-ins (development)

| Service | Without keys |
| --- | --- |
| Postgres | PGlite in `.data/pglite` |
| SMS gateway | Code printed to the server log |
| Google sign-in | Button explains it isn't set up |
| AI providers | Scripted demo model per provider (streams, can time out or fail on cue) |
| PayStation | In-app sandbox checkout (approve / fail / cancel) |
| Image provider | Generated placeholder PNG |
