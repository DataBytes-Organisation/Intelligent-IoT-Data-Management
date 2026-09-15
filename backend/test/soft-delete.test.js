const { Pool } = require('pg');

// Pool for test database
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/IoTDatabase_test',
});

// Test user UUIDs (consistent across all tests)
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_USER_2_ID = '22222222-2222-2222-2222-222222222222';

describe('Soft-Delete Functionality', () => {
  
  beforeAll(async () => {
    // Create tables and test users once before all tests
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create auth_users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
          id UUID PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Insert test users with required fields (id, email, password_hash)
      await client.query(
        `INSERT INTO auth_users (id, username, email, password_hash) 
         VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          TEST_USER_ID, 'test-user-1', 'test1@example.com', 'hashed_password_1',
          TEST_USER_2_ID, 'test-user-2', 'test2@example.com', 'hashed_password_2'
        ]
      );
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Setup error:', err.message);
    } finally {
      client.release();
    }
  });

  // Helper to run test in transaction
  async function runInTransaction(testFn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await testFn(client);
      await client.query('ROLLBACK');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  afterAll(async () => {
    await pool.end();
  });

  test('Active dataset has NULL deleted_at and deleted_by', async () => {
    await runInTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING *',
        [TEST_USER_ID, 'test-dataset-1']
      );
      
      expect(result.rows[0].deleted_at).toBeNull();
      expect(result.rows[0].deleted_by).toBeNull();
    });
  });

  test('Soft-delete sets deleted_at and deleted_by', async () => {
    await runInTransaction(async (client) => {
      // Insert test dataset
      const insertResult = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING id',
        [TEST_USER_ID, 'test-dataset-2']
      );
      const datasetId = insertResult.rows[0].id;
      
      // Soft-delete with valid test user UUID
      const deleteResult = await client.query(
        'UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 RETURNING *',
        [TEST_USER_ID, datasetId]
      );
      
      expect(deleteResult.rows[0].deleted_at).not.toBeNull();
      expect(deleteResult.rows[0].deleted_by).toBe(TEST_USER_ID);
    });
  });

  test('Active datasets query excludes soft-deleted', async () => {
    await runInTransaction(async (client) => {
      // Insert active dataset
      await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2)',
        [TEST_USER_ID, 'active-1']
      );
      
      // Insert soft-deleted dataset
      await client.query(
        'INSERT INTO datasets (created_by, name, deleted_at, deleted_by) VALUES ($1, $2, NOW(), $3)',
        [TEST_USER_ID, 'deleted-1', TEST_USER_ID]
      );
      
      // Query only active datasets
      const result = await client.query('SELECT * FROM datasets WHERE deleted_at IS NULL');
      
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows.find(r => r.name === 'active-1')).toBeDefined();
      expect(result.rows.find(r => r.name === 'deleted-1')).toBeUndefined();
    });
  });

  test('Name can be reused immediately after soft-delete (same owner)', async () => {
    await runInTransaction(async (client) => {
      const name = 'reusable-name';
      
      // Create first dataset
      const firstResult = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING id',
        [TEST_USER_ID, name]
      );
      const firstDatasetId = firstResult.rows[0].id;
      
      // Soft-delete it
      await client.query(
        'UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
        [TEST_USER_ID, firstDatasetId]
      );
      
      // Should be able to create new active dataset with same name IMMEDIATELY (same owner)
      const secondResult = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING *',
        [TEST_USER_ID, name]
      );
      
      expect(secondResult.rows[0].name).toBe(name);
      expect(secondResult.rows[0].deleted_at).toBeNull();
    });
  });

  test('Different owners can have same dataset name', async () => {
    await runInTransaction(async (client) => {
      const name = 'shared-name';
      
      // User 1 creates dataset
      const user1Result = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING id',
        [TEST_USER_ID, name]
      );
      
      // User 2 can create dataset with same name (different owner)
      const user2Result = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING *',
        [TEST_USER_2_ID, name]
      );
      
      expect(user1Result.rows[0].created_by).toBe(TEST_USER_ID);
      expect(user2Result.rows[0].created_by).toBe(TEST_USER_2_ID);
      expect(user2Result.rows[0].name).toBe(name);
    });
  });

  test('Find soft-deleted datasets', async () => {
    await runInTransaction(async (client) => {
      // Insert active dataset
      await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2)',
        [TEST_USER_ID, 'active-keep']
      );
      
      // Insert soft-deleted dataset
      await client.query(
        'INSERT INTO datasets (created_by, name, deleted_at, deleted_by) VALUES ($1, $2, NOW(), $3)',
        [TEST_USER_ID, 'deleted-find', TEST_USER_ID]
      );
      
      const result = await client.query('SELECT * FROM datasets WHERE deleted_at IS NOT NULL');
      
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows.find(r => r.name === 'deleted-find')).toBeDefined();
    });
  });

  test('Field mappings remain linked to soft-deleted dataset', async () => {
    await runInTransaction(async (client) => {
      // Create dataset
      const datasetResult = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING id',
        [TEST_USER_ID, 'mapping-test-dataset']
      );
      const datasetId = datasetResult.rows[0].id;
      
      // Insert timeseries data for this dataset
      await client.query(
        'INSERT INTO timeseries (dataset_id, created_at, entry_id, field1) VALUES ($1, NOW(), $2, $3)',
        [datasetId, 1, 25.5]
      );
      
      // Soft-delete the dataset
      await client.query(
        'UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
        [TEST_USER_ID, datasetId]
      );
      
      // Verify timeseries data still exists and links to soft-deleted dataset
      const result = await client.query(
        'SELECT t.*, d.deleted_at FROM timeseries t JOIN datasets d ON t.dataset_id = d.id WHERE d.id = $1',
        [datasetId]
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].deleted_at).not.toBeNull();
    });
  });

  test('Restore soft-deleted dataset', async () => {
    await runInTransaction(async (client) => {
      const name = 'restore-test';
      
      // Create and soft-delete
      const insertResult = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING id',
        [TEST_USER_ID, name]
      );
      const datasetId = insertResult.rows[0].id;
      
      await client.query(
        'UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
        [TEST_USER_ID, datasetId]
      );
      
      // Restore (clears deleted_at and deleted_by)
      const result = await client.query(
        'UPDATE datasets SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 RETURNING *',
        [datasetId]
      );
      
      expect(result.rows[0].deleted_at).toBeNull();
      expect(result.rows[0].deleted_by).toBeNull();
    });
  });

  test('Record permanent time-series deletion timestamp (data_deleted_at)', async () => {
    await runInTransaction(async (client) => {
      // Create dataset
      const datasetResult = await client.query(
        'INSERT INTO datasets (created_by, name) VALUES ($1, $2) RETURNING id',
        [TEST_USER_ID, 'deletion-tracking-dataset']
      );
      const datasetId = datasetResult.rows[0].id;
      
      // Soft-delete dataset (deleted_at set)
      await client.query(
        'UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
        [TEST_USER_ID, datasetId]
      );
      
      // AFI-23: Record when time-series data was permanently deleted
      const result = await client.query(
        'UPDATE datasets SET data_deleted_at = NOW() WHERE id = $1 RETURNING *',
        [datasetId]
      );
      
      expect(result.rows[0].data_deleted_at).not.toBeNull();
      expect(result.rows[0].deleted_at).not.toBeNull();
    });
  });

});
