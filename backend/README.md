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

For an existing database, apply migrations in this order after the base schema:

```bash
npm run migrate:auth
npm run migrate:dataset-import
npm run migrate:timeseries-utc
```

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

#### Verification

After migration:

- `timeseries.created_at` should use `TIMESTAMPTZ`.
- `timeseries_long.ts` should use `TIMESTAMPTZ`.
- `idx_timeseries_ts` should still exist.
- Existing time-range queries should continue to work.
