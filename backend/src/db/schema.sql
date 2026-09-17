-- ============================================================
--  Database Schema for Time-Series Backend
--  Tables: datasets, timeseries_long, timeseries
--  Author: Farris (Backend Lead)
-- ============================================================

-- Drop tables if they exist (optional for development)
--
-- This file does not create auth_users. For a fresh database, run
-- migrations/001_auth.sql before this schema so the dataset audit foreign
-- keys can be created. Do not run this file against an existing database:
-- it drops dataset and time-series tables.
DROP TABLE IF EXISTS timeseries;
DROP TABLE IF EXISTS timeseries_long;
DROP TABLE IF EXISTS datasets;

-- ============================================================
--  DATASETS TABLE
--  Stores dataset metadata (one row per dataset)
-- ============================================================

CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    timestamp_field TEXT,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A deleted dataset retains only its configuration for up to 15 days.
    -- The dataset-deletion API deletes synced data immediately and records
    -- that action in data_deleted_at; the scheduled cleanup job later removes
    -- the expired dataset row.
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    data_deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_datasets_created_by
      FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_datasets_updated_by
      FOREIGN KEY (updated_by) REFERENCES auth_users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_datasets_deleted_by
      FOREIGN KEY (deleted_by) REFERENCES auth_users(id) ON DELETE RESTRICT
);

-- Dataset names are unique only among active datasets owned by the same user.
-- A soft-deleted name can therefore be reused immediately. API upserts must
-- target this partial index's predicate rather than ON CONFLICT (name).
CREATE UNIQUE INDEX idx_datasets_active_owner_name
    ON datasets (created_by, name)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_datasets_deleted_at
    ON datasets (deleted_at)
    WHERE deleted_at IS NOT NULL;

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
    -- Event timestamps are stored as UTC instants.
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

    -- Event timestamps are stored as UTC instants.
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
