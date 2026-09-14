-- ============================================================
-- Migration: Standardise time-series timestamps as UTC TIMESTAMPTZ
--
-- Legacy assumption:
-- Existing timeseries_long.ts values represent UTC timestamps.
-- The conversion must not apply a local timezone shift.
-- ============================================================

ALTER TABLE timeseries_long
ALTER COLUMN ts TYPE TIMESTAMPTZ
USING ts AT TIME ZONE 'UTC';