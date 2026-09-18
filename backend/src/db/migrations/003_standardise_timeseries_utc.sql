-- ============================================================
-- Migration: Standardise time-series timestamps as UTC TIMESTAMPTZ
--
-- Legacy assumption:
-- Existing timeseries_long.ts values represent UTC timestamps.
--
-- Safety:
-- The conversion only runs when ts is TIMESTAMP WITHOUT TIME ZONE.
-- If ts is already TIMESTAMPTZ, the migration is a no-op.
-- ============================================================

DO $$
DECLARE
    ts_type TEXT;
BEGIN
    SELECT format_type(a.atttypid, a.atttypmod)
    INTO ts_type
    FROM pg_attribute a
    WHERE a.attrelid = 'timeseries_long'::regclass
      AND a.attname = 'ts'
      AND NOT a.attisdropped;

    IF ts_type = 'timestamp without time zone' THEN

        ALTER TABLE timeseries_long
        ALTER COLUMN ts TYPE TIMESTAMPTZ
        USING ts AT TIME ZONE 'UTC';

        RAISE NOTICE 'timeseries_long.ts converted to TIMESTAMPTZ';

    ELSIF ts_type = 'timestamp with time zone' THEN

        RAISE NOTICE 'timeseries_long.ts is already TIMESTAMPTZ; migration skipped';

    ELSE

        RAISE EXCEPTION
            'Unexpected type for timeseries_long.ts: %',
            ts_type;

    END IF;
END $$;