const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/db/pool');
const TimeseriesRepository = require('../src/repositories/timeseriesRepository');

test('dataset lookup by name is limited to active user or ThingSpeak datasets', async () => {
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
    const datasetId = await repository.getDatasetIdByName(
      'microclimate',
      'user-uuid',
      'thingspeak-owner-uuid'
    );

    assert.equal(datasetId, 42);
    assert.match(query, /deleted_at IS NULL/);
    assert.match(query, /created_by = \$2 OR created_by = \$3/);
    assert.match(query, /ORDER BY \(created_by = \$2\) DESC/);
    assert.deepEqual(params, [
      'microclimate',
      'user-uuid',
      'thingspeak-owner-uuid',
    ]);
  } finally {
    pool.query = originalQuery;
  }
});
