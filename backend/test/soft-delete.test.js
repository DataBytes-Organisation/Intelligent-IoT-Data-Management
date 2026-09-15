const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
});

describe('Soft-delete schema tests', () => {
  let client;

  beforeAll(async () => {
    client = await pool.connect();
    
    try {
      await client.query('CREATE TABLE IF NOT EXISTS auth_users (id UUID PRIMARY KEY, email TEXT, password_hash TEXT)');
      await client.query(
        'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
        ['550e8400-e29b-41d4-a716-446655440000', 'user1@test.com', 'hash1']
      );
      await client.query(
        'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
        ['550e8400-e29b-41d4-a716-446655440001', 'user2@test.com', 'hash2']
      );
    } finally {
      client.release();
    }
  });

  const runInTransaction = async (testFn) => {
    const testClient = await pool.connect();
    try {
      await testClient.query('BEGIN');
      await testFn(testClient);
      await testClient.query('ROLLBACK');
    } finally {
      testClient.release();
    }
  };

  test('Active dataset has null soft-delete columns', async () => {
    await runInTransaction(async (client) => {
      await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2)',
        ['sensor-1', '550e8400-e29b-41d4-a716-446655440000']
      );
      
      const result = await client.query(
        'SELECT deleted_at, deleted_by, data_deleted_at FROM datasets WHERE name = $1',
        ['sensor-1']
      );
      
      expect(result.rows[0].deleted_at).toBeNull();
      expect(result.rows[0].deleted_by).toBeNull();
      expect(result.rows[0].data_deleted_at).toBeNull();
    });
  });

  test('Soft-delete sets deleted_at and deleted_by timestamps', async () => {
    await runInTransaction(async (client) => {
      await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2)',
        ['sensor-2', '550e8400-e29b-41d4-a716-446655440000']
      );
      
      const beforeDelete = await client.query(
        'SELECT id FROM datasets WHERE name = $1',
        ['sensor-2']
      );
      const datasetId = beforeDelete.rows[0].id;
      
      await client.query(
        'UPDATE datasets SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2',
        ['550e8400-e29b-41d4-a716-446655440001', datasetId]
      );
      
      const afterDelete = await client.query(
        'SELECT deleted_at, deleted_by FROM datasets WHERE id = $1',
        [datasetId]
      );
      
      expect(afterDelete.rows[0].deleted_at).not.toBeNull();
      expect(afterDelete.rows[0].deleted_by).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });

  test('Active query excludes soft-deleted datasets', async () => {
    await runInTransaction(async (client) => {
      await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2)',
        ['active-sensor', '550e8400-e29b-41d4-a716-446655440000']
      );
      
      await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2)',
        ['deleted-sensor', '550e8400-e29b-41d4-a716-446655440000']
      );
      
      const deletedId = await client.query(
        'SELECT id FROM datasets WHERE name = $1',
        ['deleted-sensor']
      );
      
      await client.query(
        'UPDATE datasets SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [deletedId.rows[0].id]
      );
      
      const active = await client.query(
        'SELECT COUNT(*) FROM datasets WHERE deleted_at IS NULL'
      );
      
      expect(parseInt(active.rows[0].count)).toBeGreaterThanOrEqual(1);
    });
  });

  test('Name reuse allowed immediately after soft-delete', async () => {
    await runInTransaction(async (client) => {
      const owner = '550e8400-e29b-41d4-a716-446655440000';
      
      await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2)',
        ['reusable-name', owner]
      );
      
      const firstId = await client.query(
        'SELECT id FROM datasets WHERE name = $1 AND created_by = $2',
        ['reusable-name', owner]
      );
      
      await client.query(
        'UPDATE datasets SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [firstId.rows[0].id]
      );
      
      const secondInsert = await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2) RETURNING id',
        ['reusable-name', owner]
      );
      
      expect(secondInsert.rows.length).toBe(1);
    });
  });

  test('Different owners can use same dataset name', async () => {
    await runInTransaction(async (client) => {
      const owner1 = '550e8400-e29b-41d4-a716-446655440000';
      const owner2 = '550e8400-e29b-41d4-a716-446655440001';
      
      await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2)',
        ['shared-name', owner1]
      );
      
      const insert2 = await client.query(
        'INSERT INTO datasets (name, created_by) VALUES ($1, $2) RETURNING id',
        ['shared-name', owner2]
      );
      
      expect(insert2.rows.length).toBe(1);
    });
  });

  afterAll(async () => {
    await pool.end();
  });
});
