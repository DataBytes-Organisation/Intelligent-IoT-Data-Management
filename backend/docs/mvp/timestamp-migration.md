# Time-Series UTC Timestamp Migration

## Purpose

This migration standardises time-series event timestamps so they represent unambiguous UTC instants.

The affected columns are:

- `timeseries.created_at`
- `timeseries_long.ts`

Both columns must use PostgreSQL `TIMESTAMPTZ`.

## Current State

`timeseries.created_at` already uses `TIMESTAMPTZ`.

`timeseries_long.ts` previously used `TIMESTAMP WITHOUT TIME ZONE`.

## Legacy Timestamp Assumption

Existing values in `timeseries_long.ts` are assumed to represent UTC timestamps.

This assumption was confirmed before applying the migration.

The migration therefore interprets existing timestamp values as UTC and avoids applying the local machine timezone.

## Migration

The following conversion is used:

```sql
ALTER TABLE timeseries_long
ALTER COLUMN ts TYPE TIMESTAMPTZ
USING ts AT TIME ZONE 'UTC';
```

## Existing Data

The local development database contained no rows in `timeseries_long` at the time of migration.

For environments containing existing rows, the same migration should be used only when the stored timestamp values are confirmed to represent UTC.

## Verification

The following checks were performed:

- Confirmed `timeseries.created_at` uses `TIMESTAMPTZ`.
- Confirmed `timeseries_long.ts` uses `TIMESTAMPTZ` after migration.
- Confirmed the `idx_timeseries_ts` timestamp index still exists.
- Confirmed time-range queries continue to execute successfully.
- Confirmed schema documentation now states that event timestamps represent UTC instants.

## Running the migration (moved from the backend README)

The `timeseries_long.ts` column is standardised from `TIMESTAMP` to `TIMESTAMPTZ` so stored event timestamps represent unambiguous UTC instants.

### Before running the migration

Existing `timeseries_long.ts` values must be confirmed to represent UTC timestamps before applying this migration.

Do not run this migration on an existing environment if the legacy timestamps may represent local time, because the migration interprets existing values as UTC.

A pre-deployment audit should confirm the timezone meaning of existing timestamp values before the migration is applied.

### Run the migration

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

### Verification

After migration:

- `timeseries.created_at` should use `TIMESTAMPTZ`.
- `timeseries_long.ts` should use `TIMESTAMPTZ`.
- `idx_timeseries_ts` should still exist.
- Existing time-range queries should continue to work.
- Rerunning the migration should leave existing UTC instants unchanged.

### Integration test

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
