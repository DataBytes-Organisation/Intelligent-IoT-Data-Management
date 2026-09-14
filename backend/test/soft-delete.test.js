const { Pool } = require('pg');

// Use TEST_DATABASE_URL for isolated testing
// Falls back to development database if not set
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/IoTDatabase_test',
});

describe('Soft-Delete Functionality', () => {
  
  beforeEach(async () => {
    // Start transaction for this test
    await pool.query('BEGIN');
  });

  afterEach(async () => {
    // Rollback transaction to clean up
    // This prevents test data from persisting
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    // Close pool connection
    await pool.end();
  });

  test('Active dataset has NULL deleted_at and deleted_by', async () => {
    const result = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING *',
      ['test-dataset-1']
    );
    
    expect(result.rows[0].deleted_at).toBeNull();
    expect(result.rows[0].deleted_by).toBeNull();
  });

  test('Soft-delete sets deleted_at and deleted_by', async () => {
    // Insert test dataset
    const insertResult = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING id',
      ['test-dataset-2']
    );
    const datasetId = insertResult.rows[0].id;
    
    // Soft-delete with UUID user ID
    const deleteResult = await pool.query(
      'UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 RETURNING *',
      ['123e4567-e89b-12d3-a456-426614174000', datasetId]
    );
    
    expect(deleteResult.rows[0].deleted_at).not.toBeNull();
    expect(deleteResult.rows[0].deleted_by).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  test('Active datasets query excludes soft-deleted', async () => {
    // Insert active dataset
    await pool.query('INSERT INTO datasets (name) VALUES ($1)', ['active-1']);
    
    // Insert soft-deleted dataset
    await pool.query(
      "INSERT INTO datasets (name, deleted_at, deleted_by) VALUES ($1, NOW(), $2)",
      ['deleted-1', '123e4567-e89b-12d3-a456-426614174000']
    );
    
    // Query only active datasets
    const result = await pool.query('SELECT * FROM datasets WHERE deleted_at IS NULL');
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.find(r => r.name === 'active-1')).toBeDefined();
    expect(result.rows.find(r => r.name === 'deleted-1')).toBeUndefined();
  });

  test('Retain name during soft-delete to prevent restore conflicts', async () => {
    const name = 'reserved-name';
    
    // Create first dataset
    const firstResult = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING id',
      [name]
    );
    const firstDatasetId = firstResult.rows[0].id;
    
    // Soft-delete it
    await pool.query(
      "UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2",
      ['123e4567-e89b-12d3-a456-426614174000', firstDatasetId]
    );
    
    // Try to create new dataset with same name (should fail - name is reserved)
    try {
      await pool.query(
        'INSERT INTO datasets (name) VALUES ($1) RETURNING *',
        [name]
      );
      // If we reach here, name reuse succeeded (test fails)
      expect(true).toBe(false);
    } catch (err) {
      // Expected: unique constraint violation
      expect(err.message).toContain('unique');
    }
    
    // After 15-day cleanup, the old record is deleted and name is available
    // (cleanup job handles: DELETE FROM datasets WHERE deleted_at < NOW() - INTERVAL '15 days')
  });

  test('Find expired datasets (>15 days old)', async () => {
    // Insert dataset deleted 20 days ago (expired)
    await pool.query(
      "INSERT INTO datasets (name, deleted_at, deleted_by) VALUES ($1, NOW() - INTERVAL '20 days', $2)",
      ['expired-dataset', '123e4567-e89b-12d3-a456-426614174000']
    );
    
    // Insert dataset deleted 5 days ago (recent)
    await pool.query(
      "INSERT INTO datasets (name, deleted_at, deleted_by) VALUES ($1, NOW() - INTERVAL '5 days', $2)",
      ['recent-delete', '123e4567-e89b-12d3-a456-426614174000']
    );
    
    // Query expired datasets
    const result = await pool.query(
      "SELECT * FROM datasets WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '15 days'"
    );
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.find(r => r.name === 'expired-dataset')).toBeDefined();
    expect(result.rows.find(r => r.name === 'recent-delete')).toBeUndefined();
  });

  test('Field mappings remain linked to soft-deleted dataset', async () => {
    // Create dataset
    const datasetResult = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING id',
      ['mapping-test-dataset']
    );
    const datasetId = datasetResult.rows[0].id;
    
    // Insert timeseries data for this dataset
    await pool.query(
      'INSERT INTO timeseries (dataset_id, created_at, entry_id, field1) VALUES ($1, NOW(), $2, $3)',
      [datasetId, 1, 25.5]
    );
    
    // Soft-delete the dataset
    await pool.query(
      "UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2",
      ['123e4567-e89b-12d3-a456-426614174000', datasetId]
    );
    
    // Verify timeseries data still exists and links to soft-deleted dataset
    const result = await pool.query(
      'SELECT t.*, d.deleted_at FROM timeseries t JOIN datasets d ON t.dataset_id = d.id WHERE d.id = $1',
      [datasetId]
    );
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].deleted_at).not.toBeNull();
  });

  test('Restore soft-deleted dataset within 15-day window', async () => {
    const name = 'restore-test';
    
    // Create and soft-delete
    const insertResult = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING id',
      [name]
    );
    const datasetId = insertResult.rows[0].id;
    
    await pool.query(
      "UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2",
      ['123e4567-e89b-12d3-a456-426614174000', datasetId]
    );
    
    // Restore (clears deleted_at and deleted_by)
    const result = await pool.query(
      'UPDATE datasets SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 RETURNING *',
      [datasetId]
    );
    
    expect(result.rows[0].deleted_at).toBeNull();
    expect(result.rows[0].deleted_by).toBeNull();
  });

  test('Record permanent time-series deletion timestamp (data_deleted_at)', async () => {
    // Create dataset
    const datasetResult = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING id',
      ['deletion-tracking-dataset']
    );
    const datasetId = datasetResult.rows[0].id;
    
    // Soft-delete dataset (deleted_at set)
    await pool.query(
      "UPDATE datasets SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2",
      ['123e4567-e89b-12d3-a456-426614174000', datasetId]
    );
    
    // AFI-23: Record when time-series data was permanently deleted
    const result = await pool.query(
      'UPDATE datasets SET data_deleted_at = NOW() WHERE id = $1 RETURNING *',
      [datasetId]
    );
    
    expect(result.rows[0].data_deleted_at).not.toBeNull();
    expect(result.rows[0].deleted_at).not.toBeNull();
  });

});
