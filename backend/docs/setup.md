# Backend Database Setup Instructions

## Initial Schema Setup

When setting up a fresh backend environment:

```bash
cd backend
psql $DATABASE_URL < src/db/schema.sql
```

This creates all tables with current structure:
- datasets (with soft-delete columns)
- timeseries_long (long-format time-series)
- timeseries (wide-format ThingSpeak data)

---

## Running Migrations

After initial setup, apply pending migrations to add new features.

### Soft-Delete Feature (003_add_soft_delete.sql)

This migration adds dataset recovery, audit trail, and automated cleanup.

**Prerequisites:**
- datasets table must exist (from schema.sql)
- auth_users table must exist (for deleted_by foreign key)
- DATABASE_URL environment variable must be set

**Run the migration:**

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/IoTDatabase"
npm run migrate:soft-delete
```

**What it adds:**
- `deleted_at TIMESTAMPTZ`: when dataset was soft-deleted
- `deleted_by UUID`: which user performed deletion (foreign key to auth_users)
- `data_deleted_at TIMESTAMPTZ`: when time-series data was permanently deleted (AFI-23)
- `idx_datasets_name_active`: unique index allowing name reuse after 15-day cleanup
- `idx_datasets_deleted_at`: index for efficient cleanup queries
- UTC standardization: timeseries_long.ts now uses TIMESTAMPTZ

**Verify migration succeeded:**

```bash
psql $DATABASE_URL -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name='datasets' 
  ORDER BY ordinal_position;"
```

Expected columns:
- id (integer)
- name (text)
- description (text)
- timestamp_field (text)
- deleted_at (timestamp with time zone)
- deleted_by (uuid)
- data_deleted_at (timestamp with time zone)

---

## Name Retention Strategy

A dataset name is reserved for 15 days after soft-delete:

1. User soft-deletes dataset → deleted_at is set
2. Name cannot be reused for 15 days (unique index on active datasets)
3. Cleanup job runs daily → permanently deletes datasets older than 15 days
4. Only then can the name be reused

This prevents restore conflicts and maintains audit trail integrity.

Example cleanup query:
```sql
DELETE FROM datasets WHERE deleted_at < NOW() - INTERVAL '15 days';
```

---

## Testing the Feature

Run soft-delete tests (isolated, transaction-based):

```bash
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/IoTDatabase_test"
npm test backend/test/soft-delete.test.js
```

Tests use transaction rollback to prevent data corruption.

---

## Troubleshooting

**Migration already applied?**
```
ERROR: relation "idx_datasets_name_active" already exists
```
This is safe. The migration uses `IF NOT EXISTS` clauses. Run it again if needed.

**auth_users table doesn't exist?**
```
ERROR: relation "auth_users" does not exist
```
Create the auth_users table first (required for deleted_by foreign key):
```sql
CREATE TABLE auth_users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL
);
```

**DATABASE_URL not set?**
```
ERROR: DATABASE_URL environment variable is not set
```
Set it before running:
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/IoTDatabase"
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `backend/src/db/schema.sql` | Full database schema (fresh setup) |
| `backend/src/db/migrations/003_add_soft_delete.sql` | Migration (existing databases) |
| `backend/scripts/migrate-soft-delete.js` | Migration runner script |
| `backend/test/soft-delete.test.js` | Tests (transaction-isolated) |
| `backend/package.json` | npm script: `migrate:soft-delete` |

---

## Next Steps

After successful migration:

1. Soft-delete API (AFI-23) is ready to use
2. Dataset recovery API (AFI-24) is ready to use
3. Cleanup automation (BDAI-14) can be scheduled daily
4. Existing APIs updated to exclude soft-deleted datasets (AFI-25)

