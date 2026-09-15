const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    '../src/db/migrations/004_add_soft_delete_to_datasets.sql'
  );

  let client;

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running dataset soft-delete migration...');
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Dataset soft-delete migration completed successfully.');
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Dataset soft-delete migration rollback failed:', rollbackError.message);
      }
    }
    console.error('Dataset soft-delete migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
