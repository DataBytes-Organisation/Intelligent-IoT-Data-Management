const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    '../src/db/migrations/003_standardise_timeseries_utc.sql'
  );

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running time-series UTC migration...');

    await pool.query(sql);

    console.log('Time-series UTC migration completed successfully.');
  } catch (error) {
    console.error('Time-series UTC migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigration();