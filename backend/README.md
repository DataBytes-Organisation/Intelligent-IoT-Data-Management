# Backend

Node.js and Express API for Intelligent IoT Data Management. It stores sensor datasets in PostgreSQL, ingests CSV and ThingSpeak data, handles login (JWT, MFA by email, roles) and forwards `POST /api/analyse` to the Analytics service.

Request flow: `routes → controllers → services → repositories → PostgreSQL`.

## Quick start

Needs Node.js 20 or newer and PostgreSQL.

```bash
cd backend
cp .env.example .env    # fill in the database, JWT and mail settings
npm install
```

1. Set up the database once: follow `docs/mvp/database-and-rules.md` (fresh or existing database).
2. Start the API: `npm start` (or `npm run dev` to reload on save). It listens on port 3000 unless `PORT` is set.
3. Optional, to read MFA emails locally: `docker compose -f docker-compose.mailhog.yml up`, then open http://localhost:8025.

## Project Structure

```text
backend/
├── src/
│   ├── server.js        starts the HTTP server
│   ├── app.js           builds the Express app and mounts all routes under /api
│   ├── config/          auth and upload limit settings
│   ├── routes/          URL to controller mapping
│   ├── controllers/     read the request, call a service, send the response
│   ├── services/        business logic
│   ├── repositories/    SQL queries against PostgreSQL
│   ├── middleware/      auth, role and upload limit checks
│   ├── models/          shapes used by the repositories
│   ├── jobs/            scheduled jobs (expired dataset cleanup)
│   ├── ingestion/       CSV and ThingSpeak ingestion command line tools
│   ├── db/              connection pool, schema.sql and SQL migrations
│   └── utils/           hashing and token helpers
├── scripts/             migration and cleanup scripts run by npm (see package.json)
├── test/
│   ├── unit/            fast tests, no database needed: npm test
│   └── integration/     need a disposable PostgreSQL: npm run test:integration
├── data/
│   ├── samples/         sample ThingSpeak and mock data read by the API
│   └── mappings/        column mappings for the CSV ingestion tool
├── docs/mvp/            API contract, runbook and migration guides
├── docker-compose.mailhog.yml   local mail catcher for MFA emails
├── .env.example
└── package.json
```

Where to put new code: a new endpoint needs a route, a controller, a service and, if it touches the database, a repository. New tests go in `test/unit/` unless they need a real database.

Run the CSV ingestion tool from `backend/`:

```bash
node src/ingestion/ingest.js <csvFile> data/mappings/sensor1.json
```

## Testing

Run the unit suite from `backend`:

```bash
npm test
```

Migration integration tests require a disposable PostgreSQL database:

```bash
TEST_DATABASE_URL=postgres://... npm run test:integration
```

Each migration integration test uses a dedicated schema and a transaction that
rolls back at the end.

## More docs

| Topic | File |
|---|---|
| API contract | `docs/mvp/api-contract.md` |
| Database setup, migrations, dataset rules | `docs/mvp/database-and-rules.md` |
| Soft delete migration | `docs/mvp/soft-delete-guide.md` |
| UTC timestamp migration | `docs/mvp/timestamp-migration.md` |
| Operations runbook | `docs/mvp/operations-runbook.md` |
