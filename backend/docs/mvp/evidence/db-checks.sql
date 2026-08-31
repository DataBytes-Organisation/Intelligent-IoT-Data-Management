-- ============================================================
-- EVIDENCE: [W3] [BDAI-03] PostgreSQL Schema & Data Readiness
-- Database: PostgreSQL
-- Author: Akruti Singh
-- ============================================================

-- Schema Verification: Confirm tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('datasets', 'timeseries_long', 'timeseries');

-- Data Row Count Check: Verify stored records across schema
SELECT 'datasets' AS table_name, COUNT(*) AS row_count FROM datasets
UNION ALL
SELECT 'timeseries_long' AS table_name, COUNT(*) AS row_count FROM timeseries_long
UNION ALL
SELECT 'timeseries' AS table_name, COUNT(*) AS row_count FROM timeseries;

-- Data Usability Test: Fetch recent metrics filtered by dataset and timestamp
SELECT dataset_id, entity, metric, ts, value, quality_flag
FROM timeseries_long
WHERE ts >= NOW() - INTERVAL '30 days'
ORDER BY ts DESC
LIMIT 10;

-- Data Usability Test: Query ThingSpeak multi-field telemetry rows
SELECT dataset_id, created_at, entry_id, field1, field2, field3, field4
FROM timeseries
ORDER BY created_at DESC
LIMIT 10;

-- Index Readiness: Verify required indexes are active
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('datasets', 'timeseries_long', 'timeseries');

-- ============================================================
-- [W5] [BDAI-11] Alerts & Analytics Persistence
-- Author: Akruti Singh
-- ============================================================

-- Schema Verification: Confirm new persistence tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('alerts', 'analytics_results');

-- Table Structure & Column Validation: Inspect alerts schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'alerts'
ORDER BY ordinal_position;

-- Table Structure & Column Validation: Inspect analytics_results schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_results'
ORDER BY ordinal_position;

-- Data Retrieval Proof: Query latest triggered alerts
SELECT id, dataset_id, entity, rule_name, severity, previous_corr, current_corr, delta, triggered_at
FROM alerts
ORDER BY triggered_at DESC
LIMIT 10;

-- Data Retrieval Proof: Query historical high-severity alerts
SELECT id, dataset_id, entity, severity, reason, triggered_at
FROM alerts
WHERE severity = 'HIGH'
ORDER BY triggered_at DESC;

-- Data Retrieval Proof: Query recent computational analytics outputs
SELECT id, dataset_id, metric_type, calculated_value, window_start, window_end, created_at
FROM analytics_results
ORDER BY created_at DESC
LIMIT 10;

-- Index Readiness: Verify alert and analytics performance indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('alerts', 'analytics_results');