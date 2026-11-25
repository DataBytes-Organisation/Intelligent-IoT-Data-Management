
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('crypto');

require('dotenv').config();

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is not configured.');
}

// Ensure the repository uses our isolated test database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const db = require('../../src/db/pool');
const analyticsAlertRepository = require('../../src/repositories/analyticsAlertRepository');

test('analytics alerts are permanently saved in PostgreSQL', async (t) => {
  const userId = randomUUID();
  let datasetId;

  try {
    // Create a test user.
    await db.query(
      `INSERT INTO auth_users (id, email, password_hash)
       VALUES ($1, $2, $3)`,
      [
        userId,
        `alert-test-${userId}@example.com`,
        'test-password-hash',
      ],
    );

    // Create a test dataset belonging to the user.
    const datasetResult = await db.query(
      `INSERT INTO datasets (name, created_by)
       VALUES ($1, $2)
       RETURNING id`,
      ['Analytics alert persistence test', userId],
    );

    datasetId = datasetResult.rows[0].id;

    const alert = {
      timestamp: '2026-11-25T10:00:00.000Z',
      alert_type: 'POINTWISE_ANOMALY',
      target: {
        entity: 'sensor-001',
        metric: 'temperature',
      },
      method: 'Z_SCORE',
      score: 3.5,
      score_metadata: {
        threshold: 3,
      },
      severity: 'HIGH',
      message: 'Temperature anomaly detected',
      time_window: {
        start: '2026-11-25T09:55:00.000Z',
        end: '2026-11-25T10:00:00.000Z',
      },
      supporting_values: {
        temperature: 38.5,
      },
      source: {
        service: 'analytics',
      },
    };

    // Save the alert using the actual repository.
    const savedAlerts = await analyticsAlertRepository.createMany({
      alerts: [alert],
      userId,
      datasetId,
    });

    // Verify the repository returned a permanent UUID.
    assert.equal(savedAlerts.length, 1);
    assert.match(
      savedAlerts[0].alert_id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const alertId = savedAlerts[0].alert_id;

    // Read the alert back from PostgreSQL.
    const result = await db.query(
      `SELECT *
       FROM analytics_alerts
       WHERE id = $1 AND user_id = $2`,
      [alertId, userId],
    );

    assert.equal(result.rows.length, 1);

    const storedAlert = result.rows[0];

    assert.equal(storedAlert.dataset_id, datasetId);
    assert.equal(storedAlert.alert_type, alert.alert_type);
    assert.equal(storedAlert.method, alert.method);
    assert.equal(storedAlert.message, alert.message);
    assert.equal(storedAlert.severity, alert.severity);
    assert.equal(storedAlert.alert_data.alert_id, alertId);

    assert.deepEqual(storedAlert.target, alert.target);
    assert.deepEqual(storedAlert.source, alert.source);
    assert.deepEqual(storedAlert.supporting_values, alert.supporting_values);

    // Confirm an empty alert batch does not create records.
    const emptyResult = await analyticsAlertRepository.createMany({
      alerts: [],
      userId,
      datasetId,
    });

    assert.deepEqual(emptyResult, []);

    // Confirm the saved record still exists after the repository call.
    const persistedResult = await db.query(
      `SELECT id FROM analytics_alerts WHERE id = $1`,
      [alertId],
    );

    assert.equal(persistedResult.rows.length, 1);

    console.log('Verified alert UUID:', alertId);
    console.log('Verified alert remains stored in PostgreSQL.');
  } finally {
    // Clean up test records.
    if (datasetId !== undefined) {
      await db.query('DELETE FROM datasets WHERE id = $1', [datasetId]);
    }

    await db.query('DELETE FROM auth_users WHERE id = $1', [userId]);
  }
});

test.after(async () => {
  await db.end();
});
