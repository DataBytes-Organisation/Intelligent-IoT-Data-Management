const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/db/pool');
const TimeseriesRepository = require('../src/repositories/timeseriesRepository');

test('dataset lookup by ID is limited to active user or ThingSpeak datasets', async () => {
  const originalQuery = pool.query;
  let query;
  let params;
  pool.query = async (sql, values) => {
    query = sql;
    params = values;
    return { rows: [{ id: 42 }] };
  };

  try {
    const repository = new TimeseriesRepository();
    const datasetId = await repository.getAccessibleDatasetId(
      42,
      'user-uuid',
      'thingspeak-owner-uuid'
    );

    assert.equal(datasetId, 42);
    assert.match(query, /deleted_at IS NULL/);
    assert.match(query, /WHERE id = \$1/);
    assert.match(query, /created_by = \$2 OR created_by = \$3/);
    assert.deepEqual(params, [
      42,
      'user-uuid',
      'thingspeak-owner-uuid',
    ]);
  } finally {
    pool.query = originalQuery;
  }
});

test('legacy shared-identity name lookup remains available for the dashboard', async () => {
  const originalQuery = pool.query;
  let query;
  let params;
  pool.query = async (sql, values) => {
    query = sql;
    params = values;
    return { rows: [{ id: 42 }] };
  };

  try {
    const repository = new TimeseriesRepository();
    const datasetId = await repository.getAccessibleDatasetIdByName(
      'thingspeak-live',
      'thingspeak-owner-uuid',
      'thingspeak-owner-uuid',
    );

    assert.equal(datasetId, 42);
    assert.match(query, /WHERE name = \$1/);
    assert.match(query, /deleted_at IS NULL/);
    assert.match(query, /created_by = \$2 OR created_by = \$3/);
    assert.deepEqual(params, [
      'thingspeak-live',
      'thingspeak-owner-uuid',
      'thingspeak-owner-uuid',
    ]);
  } finally {
    pool.query = originalQuery;
  }
});
