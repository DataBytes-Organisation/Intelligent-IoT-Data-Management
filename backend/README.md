# Backend Overview

Intelligent IoT Data Management – Backend

## Overview

The backend is a Node.js + Express server designed to ingest, store, analyse, and serve IoT sensor data.

It follows a clean Controller → Service → Repository architecture and integrates with a PostgreSQL database for persistent storage.

The backend supports real-time ingestion from ThingSpeak, CSV ingestion, JWT authentication, and dataset-based API endpoints used by the frontend dashboard. For onboarding, see the Backend Onboarding Document in `Backend/docs`.

## Backend Architecture

The backend is structured into modular layers to ensure maintainability and scalability:

- Routes – define API endpoints
- Controllers – handle HTTP requests/responses
- Services – business logic
- Repositories – database queries
- Data Ingestion – ThingSpeak + CSV ingestion
- Authentication – JWT, bcrypt, RBAC
- Database Layer – PostgreSQL schema + queries

This structure ensures each layer has a single responsibility and can be extended independently.

## Key Features Implemented

### 1. Authentication

- JWT-based login and registration
- Bcrypt password hashing
- Role-Based Access Control (RBAC)
- Protected routes with middleware
- Account lockout on repeated failures

### 2. Database Layer (PostgreSQL)

- `datasets` table for dataset metadata
- `timeseries` table (wide format) for CSV + ThingSpeak ingestion
- Automatic dataset creation during ingestion
- Efficient wide-format storage for fast dashboard queries

### 3. Ingestion Pipelines

- ThingSpeak ingestion (`field1`–`field8`)
- CSV ingestion using the same wide-format structure
- Preview mode for ThingSpeak channels
- Unified ingestion logic across both sources

### 4. API Endpoints

View `Backend/docs` for API documentation.

## Project Structure

```text
backend/
│
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── dataIngestion/
│   ├── db/
│   └── utils/
│
├── docs/
│   ├── Authentication Document
│   ├── Database Implementation Documentation
│   ├── Contract With Frontend
│   └── Threat Modelling Document
│
├── server.js
├── package.json
└── schema.sql
```

To run the backend locally, view the Backend Onboarding Document in `Backend/docs/`.

### Database migrations

#### Fresh database

1. Run `npm run migrate:auth` to create `auth_users` and its dependent auth
   tables.
2. Set `THINGSPEAK_DATASET_OWNER_ID` and
   `THINGSPEAK_DATASET_OWNER_PASSWORD` in `.env`, then run
   `npm run migrate:thingspeak-owner` to create the dedicated ThingSpeak
   service account.
3. Apply `src/db/schema.sql` using the normal database setup process.
4. Run `npm run migrate:dataset-import` to create dataset field mappings.

The base schema already includes the final UTC timestamp and soft-delete
definitions, so do not run the upgrade-only timestamp or soft-delete migrations
on a fresh database. `schema.sql` drops dataset and time-series tables and must
**not** be used to upgrade an existing database.

#### Existing database

For an existing database, apply only the migrations that have not already been
applied, in this order:

```bash
npm run migrate:auth
npm run migrate:dataset-import
npm run migrate:timeseries-utc
npm run migrate:soft-delete
npm run migrate:thingspeak-owner
```

Before `npm run migrate:soft-delete`, every existing dataset must have a valid
`created_by` value. The migration stops without changing the schema if it finds
an unowned dataset. Assign an owner from `auth_users`, then rerun the command.
It makes `created_by` mandatory and replaces the former global name constraint
with active owner-scoped name uniqueness.

### Dataset soft-delete migration

`004_add_soft_delete_to_datasets.sql` adds `deleted_at`, `deleted_by`, and
`data_deleted_at` to `datasets`, plus an index for the 15-day cleanup job.

Dataset names are unique among a user's active datasets only. A name may be
reused immediately after its original dataset is soft-deleted. The migration
checks that existing datasets have a valid `created_by` value before replacing
the old global name constraint, then makes `created_by` mandatory. An operator
must assign an owner to legacy datasets before rerunning it.

Run it from `backend` with:

```bash
npm run migrate:soft-delete
```

This schema change deliberately does not delete time-series rows. The
dataset-deletion API must delete those rows and set the three deletion fields
in one transaction when a user deletes a dataset. The dataset configuration
and field mappings remain recoverable for 15 days. API code must use the
active-dataset uniqueness rule instead of `ON CONFLICT (name)`. If recovery is
attempted after the name has been reused by an active dataset owned by the same
user, the dataset-recovery API must return `409 DATASET_NAME_CONFLICT` and
require the user to choose another name.

The ThingSpeak owner provisioning command creates
`thingspeak-service@system.local` using `THINGSPEAK_DATASET_OWNER_ID` and a
bcrypt hash of `THINGSPEAK_DATASET_OWNER_PASSWORD`. Both values must be set in
the runtime `.env` before running the command; neither credential is committed
to the repository. The poller validates that the configured UUID exists and
stops the write with a clear configuration error if it does not. Legacy
CSV/ThingSpeak CLI ingestion now requires an owner UUID as well, so it cannot
create an unowned dataset.

### Dataset visibility

Dataset list, detail, series, series-filter, and timestamp endpoints require
authentication. They return active datasets created by the authenticated user
plus the shared ThingSpeak dataset owned by
`THINGSPEAK_DATASET_OWNER_ID`. They do not return another user's datasets or
soft-deleted datasets.

### Ingestion ownership

Every ingestion path must create or find a dataset using its owner:

```sql
INSERT INTO datasets (name, created_by, updated_by)
VALUES ($1, $2, $2)
ON CONFLICT (created_by, name) WHERE deleted_at IS NULL
DO UPDATE SET updated_by = EXCLUDED.updated_by,
              updated_at = CURRENT_TIMESTAMP;
```

### Testing database changes

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

### Time-Series UTC Migration

The `timeseries_long.ts` column is standardised from `TIMESTAMP` to `TIMESTAMPTZ` so stored event timestamps represent unambiguous UTC instants.

#### Before running the migration

Existing `timeseries_long.ts` values must be confirmed to represent UTC timestamps before applying this migration.

Do not run this migration on an existing environment if the legacy timestamps may represent local time, because the migration interprets existing values as UTC.

A pre-deployment audit should confirm the timezone meaning of existing timestamp values before the migration is applied.

#### Run the migration

From the `backend` directory:

```bash
npm run migrate:timeseries-utc
```

This runs:

```text
src/db/migrations/003_standardise_timeseries_utc.sql
```

The migration converts:

```text
timeseries_long.ts
TIMESTAMP -> TIMESTAMPTZ
```

using UTC as the legacy timestamp assumption.

The migration includes a type guard:

- If `timeseries_long.ts` is `TIMESTAMP WITHOUT TIME ZONE`, it is converted to `TIMESTAMPTZ` using UTC.
- If `timeseries_long.ts` is already `TIMESTAMPTZ`, the migration safely performs no conversion.
- This prevents an already-converted timestamp from being reinterpreted using the database session timezone.

#### Verification

After migration:

- `timeseries.created_at` should use `TIMESTAMPTZ`.
- `timeseries_long.ts` should use `TIMESTAMPTZ`.
- `idx_timeseries_ts` should still exist.
- Existing time-range queries should continue to work.
- Rerunning the migration should leave existing UTC instants unchanged.

#### Integration test

The UTC timestamp migration integration test uses a dedicated PostgreSQL test database configured through `TEST_DATABASE_URL`.

Run the integration test with:

```bash
npm run test:integration
```

The integration test verifies that:

- legacy `TIMESTAMP` values are converted to `TIMESTAMPTZ`
- the expected UTC instant is preserved
- rerunning the migration is safe and does not shift timestamps
- the timestamp index remains available
- time-range queries continue to work

The normal unit-test command remains:

```bash
npm test
```

The normal unit-test suite does not depend on the migration integration database.
