const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    '../src/db/migrations/004_add_soft_delete_to_datasets.sql'
  );

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running dataset soft-delete migration...');
    await pool.query(sql);
    console.log('Dataset soft-delete migration completed successfully.');
  } catch (error) {
    console.error('Dataset soft-delete migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigration();
