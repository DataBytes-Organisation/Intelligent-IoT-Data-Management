# Dataset soft-delete guide

## Purpose

Deleting a dataset permanently removes its synced time-series data immediately,
while retaining the dataset configuration for a 15-day recovery window. This
lets a user undo an accidental deletion without retaining the underlying
sensor data.

The retained configuration includes dataset metadata, the timestamp-field
selection, and saved field mappings. A recovered dataset has no synced rows;
the user must sync or import data again.

## Lifecycle

1. A user confirms deletion in the client.
2. The dataset-deletion API starts one database transaction.
3. It permanently deletes the dataset's matching `timeseries` and
   `timeseries_long` records.
4. It updates `datasets.deleted_at`, `datasets.deleted_by`, and
   `datasets.data_deleted_at` in that same transaction.
5. The dataset is hidden from normal dataset APIs but remains available to the
   recovery API for 15 days.
6. The scheduled cleanup job permanently deletes expired dataset rows. The
   foreign key cascade then removes their retained field mappings.

The deletion API must roll back if either the time-series deletion or dataset
state update fails. It must not mark a dataset as deleted if its synced data
was not removed successfully.

## Schema

The `datasets` table contains these soft-delete fields:

| Column | Type | Meaning |
| --- | --- | --- |
| `deleted_at` | `TIMESTAMPTZ` | When the user deleted the dataset configuration. |
| `deleted_by` | `UUID` | The deleting user; foreign key to `auth_users(id)`. |
| `data_deleted_at` | `TIMESTAMPTZ` | When permanent deletion of synced time-series data completed. |

`created_by` is mandatory. Active dataset names are unique per owner through
the partial index below:

```sql
CREATE UNIQUE INDEX idx_datasets_active_owner_name
  ON datasets (created_by, name)
  WHERE deleted_at IS NULL;
```

This permits a user to create a new active dataset with the same name as one
they soft-deleted. It does not permit two active datasets with the same name
for that user.

## Recovery behaviour

Recovery restores only the dataset configuration. It must clear the deletion
fields and leave time-series tables empty for that dataset.

If another active dataset owned by the same user already has the deleted
dataset's name, the dataset-recovery API must respond with:

```text
HTTP 409 Conflict
DATASET_NAME_CONFLICT
```

The client should ask the user to choose a new name before retrying recovery.

## Permanent cleanup job

The cleanup job removes datasets whose `deleted_at` is at least 15 days old.
The single `DELETE` statement is atomic. Database foreign-key cascades remove
retained field mappings and provide a final safeguard for any time-series rows
that unexpectedly remain.

Run the job once from the backend directory:

```bash
npm run cleanup:expired-datasets
```

Schedule that command once per day with the deployment platform's scheduler.
For example, a cron-managed deployment can run it at 03:00 UTC:

```cron
CRON_TZ=UTC
0 3 * * * cd /path/to/backend && /usr/bin/npm run cleanup:expired-datasets
```

Alternatively, set `DATASET_CLEANUP_ENABLED=true` on a single application
instance to run it at startup and every 24 hours. Set
`DATASET_CLEANUP_INTERVAL_MS` to change the interval; it must be at least one
hour. Do not enable this mode on multiple instances when a platform scheduler
already runs the command.

## Common Queries

### List datasets recoverable by a user

```sql
SELECT id, name, description, timestamp_field, deleted_at, data_deleted_at
FROM datasets
WHERE created_by = $1
  AND deleted_at IS NOT NULL
  AND deleted_at > CURRENT_TIMESTAMP - INTERVAL '15 days'
ORDER BY deleted_at DESC;
```

### Find datasets due for permanent cleanup

```sql
SELECT id
FROM datasets
WHERE deleted_at IS NOT NULL
  AND deleted_at <= CURRENT_TIMESTAMP - INTERVAL '15 days'
ORDER BY deleted_at ASC;
```

The scheduled cleanup job can permanently delete each returned dataset row.
The foreign key cascade removes its retained field mappings.

### Soft-delete a dataset after removing synced data

Run the time-series deletions and state update in one transaction:

```sql
BEGIN;

DELETE FROM timeseries
WHERE dataset_id = $1;

DELETE FROM timeseries_long
WHERE dataset_id = $1;

UPDATE datasets
SET deleted_at = CURRENT_TIMESTAMP,
    deleted_by = $2,
    data_deleted_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND created_by = $2
  AND deleted_at IS NULL;

COMMIT;
```

If any statement fails, use `ROLLBACK` rather than committing a partial
deletion.

### Clear deletion state during recovery

The recovery API must first verify that no active dataset owned by the user has
the same name. It can then restore the configuration with:

```sql
UPDATE datasets
SET deleted_at = NULL,
    deleted_by = NULL,
    data_deleted_at = NULL
WHERE id = $1
  AND created_by = $2
  AND deleted_at IS NOT NULL
RETURNING id, name, description, timestamp_field;
```

## Running the migration (moved from the backend README)

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
