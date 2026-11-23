# Database setup and dataset rules

Moved from the backend README. Commands run from `backend/`.

## Database migrations

### Fresh database

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

### Existing database

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

## Dataset visibility

Dataset list, detail, series, series-filter, and timestamp endpoints require
authentication. They return active datasets created by the authenticated user
plus the shared ThingSpeak dataset owned by
`THINGSPEAK_DATASET_OWNER_ID`. They do not return another user's datasets or
soft-deleted datasets.

## Ingestion ownership

Every ingestion path must create or find a dataset using its owner:

```sql
INSERT INTO datasets (name, created_by, updated_by)
VALUES ($1, $2, $2)
ON CONFLICT (created_by, name) WHERE deleted_at IS NULL
DO UPDATE SET updated_by = EXCLUDED.updated_by,
              updated_at = CURRENT_TIMESTAMP;
```

## CSV upload limits

The dataset import APIs accept the frontend's reviewed CSV rows as JSON. Each
`POST /api/datasets` or `PUT /api/datasets/:id` request is limited to **10 MiB**
and **10,000 rows**, with one to eight sensor mappings. Larger CSV files must
be split into separate uploads. See `docs/mvp/api-contract.md` for the exact
request and error-response contract.
