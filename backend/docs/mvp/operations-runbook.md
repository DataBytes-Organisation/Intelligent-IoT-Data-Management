# Backend and ThingSpeak operations runbook

**Purpose:** reproduce the active Node backend startup, readiness, ThingSpeak polling, PostgreSQL verification, and the FE authentication integration path without recording secrets in evidence.

## Environment assumptions

- Run commands from the repository root unless a command changes directory explicitly.
- Node.js 18+ is required; the baseline environment used Node.js 20.19.2. Node 18+ supplies the global `fetch` used by the active poller.
- Install the locked backend dependencies with `cd backend && npm ci`.
- PostgreSQL must be reachable using the variables below and must already have `src/db/schema.sql` applied. The schema drops tables when applied, so do not apply it to data that must be retained.
- The running environment must permit outbound HTTPS access to `api.thingspeak.com`.
- The active entry point is `backend/src/server.js`, started with `npm start` from `backend/`. `src/app.js` must export the complete Express app for tests; it must not be used as a second server or divergent route stack.
- The contract target is `backend/docs/mvp/api-contract.md` v1.0.0. Current source has legacy auth routes and no full-service health/readiness route; do not treat it as satisfying that contract until BE evidence is captured.

## Required environment

Store these in `backend/.env` or inject them through the approved secret mechanism. Do not commit real values.

```dotenv
PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
DB_NAME=...
THINGSPEAK_CHANNEL_ID=...
# Required for private channels; optional for public channels.
THINGSPEAK_READ_API_KEY=...
THINGSPEAK_RESULTS=10
THINGSPEAK_POLL_INTERVAL_MS=60000
# Required for all authentication-enabled environments. Use long random secrets;
# there are no production fallback values.
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_TTL_SECONDS=900
REMEMBER_ME_TTL_DAYS=30
SESSION_TTL_HOURS=12
MFA_OTP_TTL_SECONDS=600
MFA_RESEND_INTERVAL_SECONDS=60
PASSWORD_RESET_TTL_SECONDS=1800
# Required by BE before password reset and OTP flows are enabled.
EMAIL_FROM=...
EMAIL_PROVIDER_URL=...
EMAIL_PROVIDER_API_KEY=...
```

The active DB pool reads `DB_*` variables; supplying only `DATABASE_URL` is insufficient. `FRONTEND_ORIGIN` is a comma-separated, explicit CORS allow-list in deployed environments; it must not be `*`. BE must fail fast in production when any signing secret or enabled email-provider variable is absent. `EMAIL_PROVIDER_API_KEY` is not needed to run data-only development, but reset/MFA routes must return a controlled unavailable response or remain disabled until it is configured; they must never claim mail was sent.

## FE configuration

Local frontend `.env.local` (not committed):

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

The deployed FE supplies `VITE_API_BASE_URL=https://<api-host>/api`. It must be injected at build/deploy time, use HTTPS, have no trailing slash, and match an origin in backend `FRONTEND_ORIGIN`. All authentication requests use `credentials: 'include'`; the backend cookie is `Secure; HttpOnly; SameSite=Lax` in production. A cross-site frontend/API deployment requires an explicit architecture update for `SameSite=None; Secure`, the exact allowed origin, and CSRF protection before release.

## Prepare and start the current backend path

```bash
cd backend
npm ci
node src/server.js
```

Expected startup lines:

```text
Server running on http://localhost:3000
ThingSpeak polling started. Interval: 60000 ms
```


The poller runs immediately and then at `THINGSPEAK_POLL_INTERVAL_MS`. A successful transport request does not guarantee an insert: the current service returns early with `savedCount: 0` when ThingSpeak returns an empty `feeds` array.

In a second terminal, confirm the full server has started:

```bash
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3000/ready
```

Expected contract responses:

```json
{ "status": "ok", "timestamp": "2026-08-07T00:00:00.000Z" }
```

`/health` is liveness only. `/ready` proves required configuration and database connectivity; a dependency failure must return HTTP `503` with `READY_DEPENDENCY_UNAVAILABLE`. The root `/` route is informational only and is not a deployment probe. Until BE implements these routes in the full app, the curl commands are expected to fail and B-02 remains open.

## Authentication contract smoke checks (after BE implementation)

Run from a clean test database/mail sandbox with non-production accounts. Do not paste cookies, JWTs, OTPs, reset URLs, or API keys into logs.

```bash
cd backend
npm test
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"demo@example.test","password":"ExamplePass1!","rememberMe":false}'
```

The test run must cover registration/duplicate account, login/MFA, OTP invalid-expired-resend, refresh rotation/replay, idempotent logout, reset request/confirmation, access expiry, and multi-session revocation. Capture only redacted request/response shapes in `docs/mvp/evidence/api-samples.json`; record command, result, commit and environment in `handover.md`.

## Verify the database after a poll

Run the read-only SQL in the evidence file against the same database configured for the backend:

```bash
cd backend
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f docs/mvp/evidence/db-checks.sql
```

Or use the same read-only Node check used for the baseline:

```bash
cd backend
node - <<'NODE'
const pool = require('./src/db/pool');
(async () => {
  console.log((await pool.query('SELECT 1 AS database_connection_ok')).rows);
  console.log((await pool.query('SELECT id, name FROM datasets ORDER BY id')).rows);
  console.log((await pool.query(`SELECT d.name, COUNT(t.entry_id)::integer AS timeseries_rows FROM datasets d LEFT JOIN timeseries t ON t.dataset_id = d.id GROUP BY d.id, d.name ORDER BY d.id`)).rows);
  await pool.end();
})();
NODE
```

Success for ingestion requires all of the following:

1. The poll log has `feedCount` greater than zero and `savedCount` greater than zero.
2. `datasets` includes `thingspeak-live` (or `THINGSPEAK_DATASET_NAME` when supplied).
3. The row-count query returns a positive `timeseries_rows` value for that dataset.
