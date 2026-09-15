-- ============================================================
-- Migration: 003_add_soft_delete.sql
-- Purpose: Add soft-delete support to existing datasets table
-- For: Existing databases (schema.sql already exists without these columns)
-- ============================================================

-- Step 1: Ensure auth_users table exists with required columns
-- (This migration assumes auth infrastructure is already in place)

-- Step 2: Add soft-delete columns to datasets table
ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS data_deleted_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Add foreign key for created_by (if not exists)
ALTER TABLE datasets ADD CONSTRAINT IF NOT EXISTS fk_datasets_created_by
    FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE RESTRICT;

-- Step 4: Add foreign key for deleted_by (if not exists)
ALTER TABLE datasets ADD CONSTRAINT IF NOT EXISTS fk_datasets_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES auth_users(id) ON DELETE SET NULL;

-- Step 5: Drop the old UNIQUE constraint on name (if exists)
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS datasets_name_key;

-- Step 6: Create partial unique index on name for ACTIVE datasets only (scoped by owner)
-- This allows name reuse immediately after soft-delete
DROP INDEX IF EXISTS idx_datasets_name_active;
CREATE UNIQUE INDEX idx_datasets_active_by_owner
    ON datasets (created_by, name)
    WHERE deleted_at IS NULL;

-- Step 7: Create index on deleted_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_datasets_deleted_at
    ON datasets (deleted_at);

-- Step 8: Standardise timeseries_long.ts to TIMESTAMPTZ
-- Note: This only changes the column type, does NOT convert existing data
-- Existing timestamps are assumed to remain in their original timezone
-- Data conversion and timezone audit is handled by BDAI-15 migration (004_standardise_timeseries_utc.sql)
ALTER TABLE timeseries_long
    ALTER COLUMN ts TYPE TIMESTAMPTZ USING ts AT TIME ZONE 'UTC' WHERE FALSE;

-- Alternative: Just change the type without conversion (existing data stays as-is)
-- Uncomment below if you want NO conversion during migration
-- ALTER TABLE timeseries_long ALTER COLUMN ts TYPE TIMESTAMPTZ;

-- ============================================================
-- Migration notes:
--
-- Name reuse policy:
--   A dataset name CAN be reused immediately after soft-delete.
--   The partial unique index (created_by, name WHERE deleted_at IS NULL) allows this.
--   Only active datasets (deleted_at IS NULL) within the same owner must have unique names.
--
-- Audit trail columns:
--   created_by: UUID of user who created the dataset (auth_users.id)
--   deleted_at: timestamp when dataset was soft-deleted
--   deleted_by: UUID of user who performed deletion (auth_users.id)
--   data_deleted_at: timestamp when time-series data was permanently deleted (AFI-23)
--
-- Timestamp migration:
--   timeseries_long.ts is now TIMESTAMPTZ but existing data is NOT converted.
--   BDAI-15 will handle legacy data conversion in 004_standardise_timeseries_utc.sql
--   after timestamp timezone has been audited and approved.
--
-- Fresh installations:
--   Fresh installs use schema.sql which has all soft-delete columns from the start.
--   They do NOT run this migration.
--   Existing environments run this migration once via migrate:soft-delete script.
-- ============================================================
