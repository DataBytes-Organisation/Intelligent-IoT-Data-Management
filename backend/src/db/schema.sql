-- ============================================================
--  Database Schema for Time-Series Backend
--  Tables: datasets, timeseries_long, timeseries, auth_users
--  Author: Farris (Backend Lead)
--  Updated: W9 - Added soft-delete support
--
--  SETUP ORDER REQUIRED:
--  1. Create auth_users table (or run migrate:auth first)
--  2. Apply this schema.sql
--  3. Apply any remaining migrations
--
--  Fresh installations use this schema.sql only.
--  Existing databases apply 003_add_soft_delete.sql migration.
-- ============================================================

-- Drop tables if they exist (optional for development)
DROP TABLE IF EXISTS timeseries;
DROP TABLE IF EXISTS timeseries_long;
DROP TABLE IF EXISTS datasets;
DROP TABLE IF EXISTS auth_users;

-- ============================================================
--  AUTH_USERS TABLE (Base auth schema)
--  Required for soft-delete audit trail
-- ============================================================

CREATE TABLE auth_users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  DATASETS TABLE
--  Stores dataset metadata (one row per dataset)
--  Includes soft-delete support for recovery and audit trail
-- ============================================================

CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES auth_users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    timestamp_field TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by UUID DEFAULT NULL REFERENCES auth_users(id) ON DELETE SET NULL,
    data_deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: only active datasets must have unique names (scoped by owner)
-- Allows immediate name reuse after soft-delete within same workspace
CREATE UNIQUE INDEX idx_datasets_active_by_owner
    ON datasets (created_by, name)
    WHERE deleted_at IS NULL;

-- Index on deleted_at for efficient cleanup queries
CREATE INDEX idx_datasets_deleted_at
    ON datasets (deleted_at);

-- ============================================================
--  TIMESERIES_LONG TABLE
--  Stores long-format time-series data
--  One row per (dataset, entity, metric, timestamp)
--  Uses TIMESTAMPTZ for timezone-aware timestamps (UTC standard)
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
