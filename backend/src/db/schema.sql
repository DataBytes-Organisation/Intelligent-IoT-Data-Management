-- ============================================================
--  Database Schema for Time-Series Backend
--  Tables: datasets, timeseries_long, timeseries
--  Author: Farris (Backend Lead)
--  Updated: W9 - Added soft-delete support
-- ============================================================

-- Drop tables if they exist (optional for development)
DROP TABLE IF EXISTS timeseries;
DROP TABLE IF EXISTS timeseries_long;
DROP TABLE IF EXISTS datasets;

-- ============================================================
--  DATASETS TABLE
--  Stores dataset metadata (one row per dataset)
--  Soft-delete support: 15-day recovery period, name reservation
-- ============================================================

CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    timestamp_field TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by UUID DEFAULT NULL REFERENCES auth_users(id) ON DELETE SET NULL,
    data_deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Unique constraint on name for ACTIVE datasets only
-- (allows reuse after 15-day cleanup period)
CREATE UNIQUE INDEX idx_datasets_name_active
    ON datasets (name)
    WHERE deleted_at IS NULL;

-- Index on deleted_at for efficient queries
-- (find soft-deleted datasets, identify expired records for cleanup)
CREATE INDEX idx_datasets_deleted_at
    ON datasets (deleted_at);

-- ============================================================
--  TIMESERIES_LONG TABLE
--  Stores long-format time-series data
--  One row per (dataset, entity, metric, timestamp)
-- ============================================================

CREATE TABLE timeseries_long (
    id SERIAL PRIMARY KEY,

    dataset_id INTEGER NOT NULL REFERENCES datasets(id)
        ON DELETE CASCADE,

    entity TEXT,
    metric TEXT NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION,
    quality_flag TEXT
);

-- ============================================================
--  INDEXES (recommended for performance)
-- ============================================================

CREATE INDEX idx_timeseries_dataset_metric
    ON timeseries_long (dataset_id, metric);

CREATE INDEX idx_timeseries_ts
    ON timeseries_long (ts);

CREATE INDEX idx_timeseries_entity
    ON timeseries_long (entity);

-- ============================================================
--  TIMESERIES (WIDE FORMAT)
--  Stores ThingSpeak wide-format rows
--  One row per entry_id containing multiple fields
-- ============================================================

CREATE TABLE timeseries (
    dataset_id INTEGER NOT NULL REFERENCES datasets(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL,
    entry_id INTEGER NOT NULL,

    field1 DOUBLE PRECISION,
    field2 DOUBLE PRECISION,
    field3 DOUBLE PRECISION,
    field4 DOUBLE PRECISION,
    field5 DOUBLE PRECISION,
    field6 DOUBLE PRECISION,
    field7 DOUBLE PRECISION,
    field8 DOUBLE PRECISION,

    PRIMARY KEY (dataset_id, entry_id)
);
