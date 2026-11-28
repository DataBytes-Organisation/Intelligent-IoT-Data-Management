
-- ============================================================
-- Migration: Extend Analysis Runs
-- BE-01: Save Analysis Results
-- ============================================================

-- Allow a dataset to be deleted without deleting its analysis.
ALTER TABLE analysis_runs
    ALTER COLUMN dataset_id DROP NOT NULL;

ALTER TABLE analysis_runs
    DROP CONSTRAINT IF EXISTS analysis_runs_dataset_id_fkey;

ALTER TABLE analysis_runs
    ADD CONSTRAINT analysis_runs_dataset_id_fkey
    FOREIGN KEY (dataset_id)
    REFERENCES datasets(id)
    ON DELETE SET NULL;

-- Preserve the dataset name after the dataset is deleted.
ALTER TABLE analysis_runs
    ADD COLUMN IF NOT EXISTS dataset_name TEXT;

-- Store the complete request and Analytics response.
ALTER TABLE analysis_runs
    ADD COLUMN IF NOT EXISTS request JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE analysis_runs
    ADD COLUMN IF NOT EXISTS result JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Store Analytics response metadata.
ALTER TABLE analysis_runs
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';

ALTER TABLE analysis_runs
    ADD COLUMN IF NOT EXISTS contract_version TEXT;

ALTER TABLE analysis_runs
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;
