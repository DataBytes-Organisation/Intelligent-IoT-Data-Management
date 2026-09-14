const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

const migrationPath = path.join(
  __dirname,
  '../src/db/migrations/003_standardise_timeseries_utc.sql'
);

test('timeseries_long UTC migration preserves timestamp meaning, index and range queries', async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create an isolated schema for this test
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS utc_migration_test;
      SET search_path TO utc_migration_test;
    `);

    await client.query(`
      CREATE TABLE datasets (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      CREATE TABLE timeseries_long (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
        entity TEXT,
        metric TEXT NOT NULL,
        ts TIMESTAMP NOT NULL,
        value DOUBLE PRECISION,
        quality_flag TEXT
      );

      CREATE INDEX idx_timeseries_ts
        ON timeseries_long (ts);
    `);

    const datasetResult = await client.query(`
      INSERT INTO datasets (name)
      VALUES ('utc-migration-test')
      RETURNING id
    `);

    const datasetId = datasetResult.rows[0].id;

    await client.query(
      `
      INSERT INTO timeseries_long (
        dataset_id,
        entity,
        metric,
        ts,
        value
      )
      VALUES (
        $1,
        'sensor-1',
        'temperature',
        '2026-09-09 10:00:00',
        25.5
      )
      `,
      [datasetId]
    );

    let migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Ensure the migration applies inside the test schema
    migrationSql = migrationSql.replace(
      /timeseries_long/g,
      'utc_migration_test.timeseries_long'
    );

    await client.query(migrationSql);

    const typeResult = await client.query(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'utc_migration_test'
        AND table_name = 'timeseries_long'
        AND column_name = 'ts'
    `);

    assert.equal(
      typeResult.rows[0].data_type,
      'timestamp with time zone'
    );

    const timestampResult = await client.query(`
      SELECT ts
      FROM utc_migration_test.timeseries_long
      LIMIT 1
    `);

    assert.equal(
      new Date(timestampResult.rows[0].ts).toISOString(),
      '2026-09-09T10:00:00.000Z'
    );

    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'utc_migration_test'
        AND tablename = 'timeseries_long'
        AND indexname = 'idx_timeseries_ts'
    `);

    assert.equal(indexResult.rows.length, 1);

    const rangeResult = await client.query(`
      SELECT *
      FROM utc_migration_test.timeseries_long
      WHERE ts >= '2026-09-09T09:00:00Z'
        AND ts <  '2026-09-09T11:00:00Z'
    `);

    assert.equal(rangeResult.rows.length, 1);

  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
});