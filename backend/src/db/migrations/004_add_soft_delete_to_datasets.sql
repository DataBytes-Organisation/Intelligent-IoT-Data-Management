-- ============================================================
-- Migration: Add soft-delete support for datasets
--
-- Prerequisites:
--   * 001_auth.sql
--   * 002_dataset_management.sql
--
-- This migration retains dataset configuration and field mappings for the
-- 15-day recovery period. It does not delete time-series data; the
-- dataset-deletion API owns that transactional deletion workflow.
-- ============================================================

DO $$
DECLARE
  null_owner_count BIGINT;
  old_name_constraint TEXT;
BEGIN
  IF to_regclass('datasets') IS NULL THEN
    RAISE EXCEPTION 'datasets does not exist. Apply the base schema first.';
  END IF;

  IF to_regclass('auth_users') IS NULL THEN
    RAISE EXCEPTION 'auth_users does not exist. Apply 001_auth.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'datasets'::regclass
      AND attname = 'created_by'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION
      'datasets.created_by does not exist. Apply 002_dataset_management.sql first.';
  END IF;

  SELECT COUNT(*)
  INTO null_owner_count
  FROM datasets
  WHERE created_by IS NULL;

  IF null_owner_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enable owner-scoped dataset-name reuse: % dataset(s) have no created_by. Assign each dataset to an auth_users record, then rerun this migration.',
      null_owner_count;
  END IF;

  -- Remove only the legacy single-column UNIQUE(name) constraint. Other
  -- uniqueness constraints remain untouched.
  SELECT c.conname
  INTO old_name_constraint
  FROM pg_constraint c
  WHERE c.conrelid = 'datasets'::regclass
    AND c.contype = 'u'
    AND c.conkey = ARRAY[
      (
        SELECT attnum
        FROM pg_attribute
        WHERE attrelid = 'datasets'::regclass
          AND attname = 'name'
          AND NOT attisdropped
      )
    ];

  IF old_name_constraint IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE datasets DROP CONSTRAINT %I',
      old_name_constraint
    );
  END IF;
END $$;

ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS data_deleted_at TIMESTAMPTZ;

-- The active-name index is owner-scoped. The preflight above guarantees that
-- enforcing this invariant does not silently create a NULL-owner loophole.
ALTER TABLE datasets
  ALTER COLUMN created_by SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'datasets'::regclass
      AND conname = 'fk_datasets_deleted_by'
  ) THEN
    ALTER TABLE datasets
      ADD CONSTRAINT fk_datasets_deleted_by
      FOREIGN KEY (deleted_by)
      REFERENCES auth_users(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Immediate name reuse is allowed after a dataset is soft-deleted. The index
-- is intentionally scoped to the active rows and their owner.
CREATE UNIQUE INDEX IF NOT EXISTS idx_datasets_active_owner_name
  ON datasets (created_by, name)
  WHERE deleted_at IS NULL;

-- The scheduled cleanup job uses this index to find expired recovery windows.
CREATE INDEX IF NOT EXISTS idx_datasets_deleted_at
  ON datasets (deleted_at)
  WHERE deleted_at IS NOT NULL;
