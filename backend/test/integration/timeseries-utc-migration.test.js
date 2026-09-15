const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is required to run the time-series migration integration test'
  );
}

const pool = new Pool({
  connectionString: TEST_DATABASE_URL
});

const migrationPath = path.join(
  __dirname,
  '../../src/db/migrations/003_standardise_timeseries_utc.sql'
);

test.after(async () => {
  await pool.end();
});

test(
  'timeseries_long UTC migration is safe, repeatable, and preserves queries/indexes',
  async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Use a non-UTC session timezone so accidental timezone
      // reinterpretation would be detected by the test.
      await client.query(`
        SET LOCAL TIME ZONE 'Australia/Melbourne'
      `);

      await client.query(`
        CREATE SCHEMA utc_migration_test;

        SET LOCAL search_path TO utc_migration_test, public;

        CREATE TABLE timeseries_long (
          id SERIAL PRIMARY KEY,
          ts TIMESTAMP NOT NULL,
          value DOUBLE PRECISION
        );

        CREATE INDEX idx_timeseries_ts
          ON timeseries_long (ts);

        INSERT INTO timeseries_long (ts, value)
        VALUES ('2026-09-09 10:00:00', 25.5);
      `);

      const migrationSql = fs.readFileSync(
        migrationPath,
        'utf8'
      );

      // First migration run
      await client.query(migrationSql);

      const firstTypeResult = await client.query(`
        SELECT format_type(a.atttypid, a.atttypmod) AS type
        FROM pg_attribute a
        WHERE a.attrelid = 'timeseries_long'::regclass
          AND a.attname = 'ts'
          AND NOT a.attisdropped
      `);

      assert.equal(
        firstTypeResult.rows[0].type,
        'timestamp with time zone'
      );

      const firstTimestampResult = await client.query(`
        SELECT ts
        FROM timeseries_long
        LIMIT 1
      `);

      const firstTimestamp =
        firstTimestampResult.rows[0].ts.toISOString();

      assert.equal(
        firstTimestamp,
        '2026-09-09T10:00:00.000Z'
      );

      // Verify index still exists
      const indexResult = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'utc_migration_test'
          AND tablename = 'timeseries_long'
          AND indexname = 'idx_timeseries_ts'
      `);

      assert.equal(indexResult.rows.length, 1);

      // Verify time-range query still works
      const rangeResult = await client.query(`
        SELECT *
        FROM timeseries_long
        WHERE ts >= '2026-09-09T09:00:00Z'
          AND ts <  '2026-09-09T11:00:00Z'
      `);

      assert.equal(rangeResult.rows.length, 1);

      // Run migration a second time
      await client.query(migrationSql);

      const secondTimestampResult = await client.query(`
        SELECT ts
        FROM timeseries_long
        LIMIT 1
      `);

      const secondTimestamp =
        secondTimestampResult.rows[0].ts.toISOString();

      // Timestamp must not change after rerunning migration
      assert.equal(secondTimestamp, firstTimestamp);

      const secondTypeResult = await client.query(`
        SELECT format_type(a.atttypid, a.atttypmod) AS type
        FROM pg_attribute a
        WHERE a.attrelid = 'timeseries_long'::regclass
          AND a.attname = 'ts'
          AND NOT a.attisdropped
      `);

      assert.equal(
        secondTypeResult.rows[0].type,
        'timestamp with time zone'
      );

    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }
);