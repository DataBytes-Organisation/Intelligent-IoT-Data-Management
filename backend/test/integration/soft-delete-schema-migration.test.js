const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is required to run the soft-delete migration integration test'
  );
}

const pool = new Pool({ connectionString: TEST_DATABASE_URL });
const migrationPath = path.join(
  __dirname,
  '../../src/db/migrations/004_add_soft_delete_to_datasets.sql'
);

test.after(async () => {
  await pool.end();
});

test(
  'soft-delete migration retains configuration and allows immediate name reuse',
  async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`
        CREATE SCHEMA soft_delete_migration_test;
        SET LOCAL search_path TO soft_delete_migration_test, public;

        CREATE TABLE auth_users (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL
        );

        INSERT INTO auth_users (id, email, password_hash)
        VALUES (
          '11111111-1111-1111-1111-111111111111',
          'owner@example.com',
          'hash'
        );

        CREATE TABLE datasets (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          timestamp_field TEXT,
          created_by UUID NOT NULL REFERENCES auth_users(id)
        );

        CREATE TABLE dataset_field_mappings (
          id SERIAL PRIMARY KEY,
          dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
          source_field TEXT NOT NULL,
          storage_field TEXT NOT NULL
        );

        INSERT INTO datasets (name, description, timestamp_field, created_by)
        VALUES (
          'microclimate',
          'Original configuration',
          'recorded_at',
          '11111111-1111-1111-1111-111111111111'
        );

        INSERT INTO dataset_field_mappings (dataset_id, source_field, storage_field)
        VALUES (1, 'temperature', 'field1');
      `);

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(migrationSql);
      await client.query(migrationSql);

      const ownerRequiredResult = await client.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'soft_delete_migration_test'
          AND table_name = 'datasets'
          AND column_name = 'created_by'
      `);
      assert.equal(ownerRequiredResult.rows[0].is_nullable, 'NO');

      await client.query('SAVEPOINT owner_required_check');
      await assert.rejects(
        client.query(`
          INSERT INTO datasets (name)
          VALUES ('unowned-dataset')
        `),
        { code: '23502' }
      );
      await client.query('ROLLBACK TO SAVEPOINT owner_required_check');

      await client.query('SAVEPOINT active_name_check');
      await assert.rejects(
        client.query(`
          INSERT INTO datasets (name, created_by)
          VALUES (
            'microclimate',
            '11111111-1111-1111-1111-111111111111'
          )
        `),
        { code: '23505' }
      );
      await client.query('ROLLBACK TO SAVEPOINT active_name_check');

      await client.query(`
        UPDATE datasets
        SET deleted_at = CURRENT_TIMESTAMP,
            deleted_by = '11111111-1111-1111-1111-111111111111',
            data_deleted_at = CURRENT_TIMESTAMP
        WHERE id = 1;

        INSERT INTO datasets (name, created_by)
        VALUES (
          'microclimate',
          '11111111-1111-1111-1111-111111111111'
        );
      `);

      const result = await client.query(`
        SELECT
          d.description,
          d.timestamp_field,
          d.deleted_at,
          d.deleted_by,
          d.data_deleted_at,
          COUNT(m.id)::integer AS mapping_count
        FROM datasets d
        LEFT JOIN dataset_field_mappings m ON m.dataset_id = d.id
        WHERE d.id = 1
        GROUP BY d.id
      `);

      assert.equal(result.rows.length, 1);
      assert.equal(result.rows[0].description, 'Original configuration');
      assert.equal(result.rows[0].timestamp_field, 'recorded_at');
      assert.equal(result.rows[0].mapping_count, 1);
      assert.ok(result.rows[0].deleted_at);
      assert.equal(
        result.rows[0].deleted_by,
        '11111111-1111-1111-1111-111111111111'
      );
      assert.ok(result.rows[0].data_deleted_at);

      const activeNameResult = await client.query(`
        SELECT COUNT(*)::integer AS count
        FROM datasets
        WHERE name = 'microclimate'
          AND deleted_at IS NULL
      `);
      assert.equal(activeNameResult.rows[0].count, 1);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }
);
