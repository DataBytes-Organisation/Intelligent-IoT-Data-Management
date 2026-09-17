const test = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { purgeExpiredDatasets } = require('../../src/services/datasetCleanupService');
require('dotenv').config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is required to run the dataset cleanup integration test'
  );
}

const pool = new Pool({ connectionString: TEST_DATABASE_URL });

test.after(async () => {
  await pool.end();
});

test('cleanup removes expired datasets and their cascading rows, but retains recoverable datasets', async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE SCHEMA dataset_cleanup_test;
      SET LOCAL search_path TO dataset_cleanup_test, public;

      CREATE TABLE datasets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE dataset_field_mappings (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE
      );

      CREATE TABLE timeseries (
        dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
        entry_id INTEGER NOT NULL,
        PRIMARY KEY (dataset_id, entry_id)
      );

      CREATE TABLE timeseries_long (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE
      );

      INSERT INTO datasets (name, deleted_at)
      VALUES
        ('expired', CURRENT_TIMESTAMP - INTERVAL '16 days'),
        ('recoverable', CURRENT_TIMESTAMP - INTERVAL '14 days');

      INSERT INTO dataset_field_mappings (dataset_id) VALUES (1), (2);
      INSERT INTO timeseries (dataset_id, entry_id) VALUES (1, 1), (2, 1);
      INSERT INTO timeseries_long (dataset_id) VALUES (1), (2);
    `);

    const result = await purgeExpiredDatasets(client);
    assert.deepEqual(result, { deletedCount: 1, datasetIds: [1] });

    const datasetRows = await client.query(
      'SELECT id FROM datasets ORDER BY id'
    );
    assert.deepEqual(datasetRows.rows, [{ id: 2 }]);

    for (const table of [
      'dataset_field_mappings',
      'timeseries',
      'timeseries_long',
    ]) {
      const rows = await client.query(`SELECT dataset_id FROM ${table} ORDER BY dataset_id`);
      assert.deepEqual(rows.rows, [{ dataset_id: 2 }]);
    }
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
});
