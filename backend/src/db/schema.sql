-- ============================================================
--  Database Schema for Time-Series Backend
--  Tables: datasets, timeseries_long, timeseries, alerts, analytics_results
--  Author: Farris (Backend Lead), Akruti 
-- ============================================================

-- Drop tables if they exist (optional for development)
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS analytics_results;
DROP TABLE IF EXISTS timeseries;
DROP TABLE IF EXISTS timeseries_long;
DROP TABLE IF EXISTS datasets;

-- ============================================================
--  DATASETS TABLE
--  Stores dataset metadata (one row per dataset)
-- ============================================================

CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

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
    ts TIMESTAMP NOT NULL,
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

-- ============================================================
--  ALERTS TABLE
-- Stores alert instances and severity levels
-- One row per triggered alert event
-- ============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    entity VARCHAR(255) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    previous_corr DOUBLE PRECISION,
    current_corr DOUBLE PRECISION,
    delta DOUBLE PRECISION,
    reason TEXT,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  ANALYTICS_RESULTS TABLE
--  Stores computational metrics
-- One row per analytical window calculation
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_results (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    metric_type VARCHAR(255) NOT NULL,
    calculated_value DOUBLE PRECISION NOT NULL,
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  INDEXES FOR ALERTS & ANALYTICS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_alerts_dataset_triggered 
    ON alerts(dataset_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_severity 
    ON alerts(severity);

CREATE INDEX IF NOT EXISTS idx_analytics_results_dataset_created 
    ON analytics_results(dataset_id, created_at DESC);

-- ============================================================
--  AUTOMATED CLEANUP PROCEDURE
-- ============================================================

    CREATE OR REPLACE FUNCTION purge_expired_datasets()
RETURNS TABLE(purged_id INT, purged_name TEXT) 
LANGUAGE sql AS 
'
    DELETE FROM datasets
    WHERE deleted_at IS NOT NULL
      AND deleted_at <= NOW() - INTERVAL ''15 days''
    RETURNING id, name;
';