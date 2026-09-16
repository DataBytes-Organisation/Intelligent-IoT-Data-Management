const test = require('node:test');
const assert = require('node:assert/strict');
const {
  RECOVERY_WINDOW_DAYS,
  purgeExpiredDatasets,
} = require('../src/services/datasetCleanupService');
const {
  DEFAULT_INTERVAL_MS,
  MINIMUM_INTERVAL_MS,
  resolveIntervalMs,
  startDatasetCleanupJob,
} = require('../src/jobs/datasetCleanupJob');

test('purgeExpiredDatasets deletes only datasets outside the 15-day recovery window', async () => {
  let query;
  const db = {
    async query(sql) {
      query = sql;
      return { rowCount: 2, rows: [{ id: 12 }, { id: 24 }] };
    },
  };

  const result = await purgeExpiredDatasets(db);

  assert.deepEqual(result, { deletedCount: 2, datasetIds: [12, 24] });
  assert.match(query, /DELETE FROM datasets/);
  assert.match(query, /deleted_at IS NOT NULL/);
  assert.match(
    query,
    new RegExp(`deleted_at <= CURRENT_TIMESTAMP - INTERVAL '${RECOVERY_WINDOW_DAYS} days'`)
  );
  assert.match(query, /RETURNING id/);
});

test('cleanup schedule is disabled by default', () => {
  const job = startDatasetCleanupJob({ enabled: false });
  assert.doesNotThrow(() => job.stop());
});

test('cleanup interval defaults to daily and rejects unsafe schedules', () => {
  assert.equal(resolveIntervalMs(), DEFAULT_INTERVAL_MS);
  assert.equal(resolveIntervalMs(String(MINIMUM_INTERVAL_MS)), MINIMUM_INTERVAL_MS);
  assert.throws(() => resolveIntervalMs('1000'), /at least/);
  assert.throws(() => resolveIntervalMs('not-a-number'), /must be an integer/);
});
