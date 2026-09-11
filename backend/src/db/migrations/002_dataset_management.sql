-- ============================================================
-- Dataset Management Schema
-- ============================================================
-- Apply after 001_auth.sql and the base schema.

-- ============================================================
-- 1. Dataset metadata, ownership, and audit fields
-- ============================================================

ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS timestamp_field TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_datasets_created_by
  ON datasets(created_by);

-- ============================================================
-- 2. Dataset user foreign keys
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_datasets_created_by'
      AND t.relname = 'datasets'
  ) THEN
    ALTER TABLE datasets
      ADD CONSTRAINT fk_datasets_created_by
      FOREIGN KEY (created_by)
      REFERENCES auth_users(id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_datasets_updated_by'
      AND t.relname = 'datasets'
  ) THEN
    ALTER TABLE datasets
      ADD CONSTRAINT fk_datasets_updated_by
      FOREIGN KEY (updated_by)
      REFERENCES auth_users(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================
-- 3. Dataset field mappings
-- ============================================================

CREATE TABLE IF NOT EXISTS dataset_field_mappings (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL,
  storage_field TEXT NOT NULL,
  source_data_type TEXT NOT NULL
    CHECK (source_data_type IN ('number', 'text', 'datetime', 'boolean')),
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  CONSTRAINT fk_dataset_field_mappings_created_by
    FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dataset_field_mappings_updated_by
    FOREIGN KEY (updated_by) REFERENCES auth_users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_dataset_field_mappings_storage_field
    CHECK (storage_field IN (
      'field1', 'field2', 'field3', 'field4',
      'field5', 'field6', 'field7', 'field8'
    )),
  CONSTRAINT uq_dataset_field_mappings_storage_field
    UNIQUE (dataset_id, storage_field),
  CONSTRAINT uq_dataset_field_mappings_source_field
    UNIQUE (dataset_id, source_field)
);
