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
