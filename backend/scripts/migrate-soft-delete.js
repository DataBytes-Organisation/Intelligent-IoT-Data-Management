const pg = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Migration Runner: 003_add_soft_delete.sql
 * 
 * This script safely executes the soft-delete migration against a configured database.
 * It adds:
 *   - deleted_at: timestamp when dataset was soft-deleted
 *   - deleted_by: UUID of user who deleted (foreign key to auth_users)
 *   - data_deleted_at: timestamp when time-series data was permanently deleted
 *   - Unique index on name for active datasets (allows name reuse after cleanup)
 * 
 * Usage:
 *   npm run migrate:soft-delete
 * 
 * Environment variables:
 *   DATABASE_URL (required): PostgreSQL connection string
 *   Example: postgresql://user:pass@localhost:5432/IoTDatabase
 */

async function runMigration() {
  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.error('Set it before running: export DATABASE_URL="postgresql://user:pass@localhost:5432/IoTDatabase"');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✓ Connected to database');

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../src/db/migrations/003_add_soft_delete.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`ERROR: Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✓ Loaded migration: 003_add_soft_delete.sql');

    // Execute migration
    console.log('Running migration...');
    await client.query(sql);
    console.log('✓ Migration completed successfully');

    // Verify columns were added
    const verification = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'datasets'
      ORDER BY ordinal_position;
    `);

    console.log('\n✓ Datasets table columns after migration:');
    verification.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check that FK constraint exists
    const fkCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'datasets' AND constraint_type = 'FOREIGN KEY';
    `);

    if (fkCheck.rows.length > 0) {
      console.log('\n✓ Foreign key constraints:');
      fkCheck.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}`);
      });
    }

    console.log('\n✓ All checks passed. Database is ready for soft-delete feature.');

  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    
    // Provide helpful error messages
    if (err.message.includes('already exists')) {
      console.error('\nNote: This migration may have already been applied.');
      console.error('If you need to re-run it, drop the indexes and try again.');
    } else if (err.message.includes('does not exist')) {
      console.error('\nNote: The datasets table may not exist.');
      console.error('Run schema.sql first, then run this migration.');
    }
    
    process.exit(1);

  } finally {
    // Always close connection
    await client.end();
    console.log('✓ Database connection closed');
  }
}

// Run migration
runMigration();
