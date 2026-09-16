# MVP Operations Runbook

## 1. Purpose

This runbook documents the local setup, backend startup, database verification, ThingSpeak polling, frontend integration, and authentication checks for the Intelligent IoT Data Management project.

It also records the main environment issues identified during the MVP baseline testing.

## 2. Environment

Validated local environment:

- Node.js 18+ (baseline tested with Node.js 20.19.2)
- PostgreSQL 18
- Database: `IoTDatabase`
- Backend: Node.js + Express
- Frontend: React + Vite
- Python 3.12 available for Python components

Default ports:

- Backend: `3000`
- Frontend: `5173`
- PostgreSQL: `5432`

## 3. Database Setup

Create the PostgreSQL database:

`IoTDatabase`

Apply the existing schema from:

`backend/src/db/schema.sql`

The schema can drop existing tables when applied, so do not apply it to data that must be retained.

Configure the database values in:

`backend/.env`

Required database configuration:

- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

Credentials and secrets must not be committed to Git.

PostgreSQL connectivity can be verified using the backend database connection and dataset queries.

## 4. Backend Configuration

Create `backend/.env` with the required environment variables.

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
THINGSPEAK_READ_API_KEY=...
THINGSPEAK_RESULTS=10
THINGSPEAK_POLL_INTERVAL_MS=60000

JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_TTL_SECONDS=900
SESSION_TTL_HOURS=12
```

## ThingSpeak Polling Verification

1. The poll log has `feedCount` greater than zero and `savedCount` greater than zero.
2. `datasets` includes `thingspeak-live` (or `THINGSPEAK_DATASET_NAME` when supplied).
3. The row-count query returns a positive `timeseries_rows` value for that dataset.

## AFI-08 Setup Risk Notes

- The active backend entry point is `backend/src/server.js`; smoke checks must target this file, not a separate Express app.
- Environment variables are expected from `backend/.env` or the deployment secret mechanism.
- Real `.env` files must not be committed.
- `/health` is a liveness check and must not depend on the database.
- `/ready` validates required environment and database connectivity; it may return HTTP 503 when dependencies are unavailable.
- `npm test` is the repeatable local smoke test entry point for startup and route checks.
- PostgreSQL schema setup must use a safe demo database because `backend/src/db/schema.sql` can reset tables.