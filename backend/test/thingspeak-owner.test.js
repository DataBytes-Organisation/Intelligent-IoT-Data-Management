const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/db/pool');
const {
  saveThingSpeakRawDataToDatabase,
} = require('../src/services/thingspeakService');

const feeds = [{ entry_id: 1, created_at: '2026-09-16T00:00:00Z' }];

test('ThingSpeak writes require a configured dataset owner', async () => {
  const originalOwnerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  delete process.env.THINGSPEAK_DATASET_OWNER_ID;

  try {
    await assert.rejects(
      () => saveThingSpeakRawDataToDatabase({ feeds }),
      /THINGSPEAK_DATASET_OWNER_ID is required/
    );
  } finally {
    if (originalOwnerId === undefined) {
      delete process.env.THINGSPEAK_DATASET_OWNER_ID;
    } else {
      process.env.THINGSPEAK_DATASET_OWNER_ID = originalOwnerId;
    }
  }
});

test('ThingSpeak writes reject an owner that is not in auth_users', async () => {
  const originalOwnerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  const originalQuery = pool.query;
  process.env.THINGSPEAK_DATASET_OWNER_ID =
    '11111111-1111-1111-1111-111111111111';

  pool.query = async (sql, values) => {
    assert.match(sql, /SELECT id FROM auth_users WHERE id = \$1/);
    assert.deepEqual(values, [process.env.THINGSPEAK_DATASET_OWNER_ID]);
    return { rows: [] };
  };

  try {
    await assert.rejects(
      () => saveThingSpeakRawDataToDatabase({ feeds }),
      /must reference an existing auth_users record/
    );
  } finally {
    pool.query = originalQuery;
    if (originalOwnerId === undefined) {
      delete process.env.THINGSPEAK_DATASET_OWNER_ID;
    } else {
      process.env.THINGSPEAK_DATASET_OWNER_ID = originalOwnerId;
    }
  }
});
