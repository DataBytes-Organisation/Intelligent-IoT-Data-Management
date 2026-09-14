-- ============================================================
-- Migration: 003_add_soft_delete.sql
-- Purpose: Add soft-delete support to existing datasets table
-- Allows: 15-day recovery period, audit trail (deleted_by), 
--         time-series permanent deletion tracking (data_deleted_at)
-- ============================================================

-- Step 1: Add soft-delete columns to datasets table
ALTER TABLE datasets
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN deleted_by UUID DEFAULT NULL,
    ADD COLUMN data_deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Step 2: Add foreign key constraint for deleted_by
-- Links to auth_users(id) to track which user performed deletion
ALTER TABLE datasets ADD CONSTRAINT fk_datasets_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES auth_users(id) ON DELETE SET NULL;

-- Step 3: Add description and timestamp_field if they don't exist
-- (support fresh setup via schema.sql)
ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS timestamp_field TEXT;

-- Step 4: Drop the old UNIQUE constraint on name (if exists)
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS datasets_name_key;

-- Step 5: Create conditional unique index on name for ACTIVE datasets only
-- This allows name reuse after 15-day cleanup period
CREATE UNIQUE INDEX IF NOT EXISTS idx_datasets_name_active
    ON datasets (name)
    WHERE deleted_at IS NULL;

-- Step 6: Create index on deleted_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_datasets_deleted_at
    ON datasets (deleted_at);

-- Step 7: Standardise timeseries_long.ts to TIMESTAMPTZ
-- Assumes existing data is UTC (no time shift)
ALTER TABLE timeseries_long
    ALTER COLUMN ts TYPE TIMESTAMPTZ USING ts AT TIME ZONE 'UTC';

-- ============================================================
-- Migration notes:
--
-- Name retention strategy:
--   A dataset name is reserved for 15 days after soft-delete.
--   The cleanup job (BDAI-14) permanently deletes after 15 days.
--   Only then can the name be reused.
--   This prevents restore conflicts and maintains audit trail integrity.
--
--   Cleanup job will use:
--   DELETE FROM datasets WHERE deleted_at < NOW() - INTERVAL '15 days';
--
-- Audit trail:
--   deleted_at: timestamp when dataset was soft-deleted
--   deleted_by: UUID of user who performed deletion (auth_users.id)
--   data_deleted_at: timestamp when time-series data was permanently deleted (AFI-23)
-- ============================================================
