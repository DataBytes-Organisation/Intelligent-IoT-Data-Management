-- Migration 003: Add soft-delete columns and constraints to datasets table
-- Soft-delete allows recovery of deleted datasets within 15 days
-- Fresh installs use schema.sql; existing databases run this migration

BEGIN;

-- Add soft-delete columns if they don't exist
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS data_deleted_at TIMESTAMPTZ;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraints (NO IF NOT EXISTS syntax - PostgreSQL requires explicit constraint names)
ALTER TABLE datasets ADD CONSTRAINT fk_datasets_created_by FOREIGN KEY (created_by) REFERENCES auth_users(id);
ALTER TABLE datasets ADD CONSTRAINT fk_datasets_deleted_by FOREIGN KEY (deleted_by) REFERENCES auth_users(id);

-- Replace old full unique constraint on name with partial unique index
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS datasets_name_key;
CREATE UNIQUE INDEX idx_datasets_active_by_owner ON datasets (created_by, name) WHERE deleted_at IS NULL;

-- Index for fast deletion queries
CREATE INDEX IF NOT EXISTS idx_datasets_deleted_at ON datasets (deleted_at);

COMMIT;
