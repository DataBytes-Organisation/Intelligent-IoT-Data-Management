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