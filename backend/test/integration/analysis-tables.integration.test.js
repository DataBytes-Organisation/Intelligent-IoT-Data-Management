const test = require("node:test");
const assert = require("node:assert/strict");
const { Pool } = require("pg");
require("dotenv").config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is required to run the analysis tables integration test",
  );
}

const pool = new Pool({ connectionString: TEST_DATABASE_URL });

test.after(async () => {
  await pool.end();
});

test("analysis runs and alerts can be saved and read back", async () => {
  const client = await pool.connect();

  const schema = `analysis_test_${process.pid}`;

  try {
    await client.query("BEGIN");

    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET LOCAL search_path TO ${schema}, public`);

    await client.query(`
      CREATE TABLE auth_users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE datasets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE analysis_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth_users(id),
        dataset_id INTEGER NOT NULL REFERENCES datasets(id),
        streams JSONB NOT NULL DEFAULT '[]'::jsonb,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE analysis_alerts (
        id UUID PRIMARY KEY,
        run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
        timestamp TIMESTAMPTZ NOT NULL,
        alert_type TEXT NOT NULL,
        target JSONB NOT NULL,
        method TEXT NOT NULL,
        message TEXT NOT NULL,
        source JSONB NOT NULL,
        score DOUBLE PRECISION,
        score_metadata JSONB,
        severity TEXT,
        time_window JSONB,
        supporting_values JSONB
      );
    `);

    const userId = "11111111-1111-1111-1111-111111111111";

    await client.query(
      `INSERT INTO auth_users (id, email, password_hash)
       VALUES ($1, $2, $3)`,
      [userId, "analysis-test@example.com", "test-hash"],
    );

    const datasetResult = await client.query(
      `INSERT INTO datasets (name) VALUES ($1) RETURNING id`,
      ["analysis-test-dataset"],
    );

    const datasetId = datasetResult.rows[0].id;

    const streams = ["temperature", "humidity"];
    const settings = {
      model: { metric: "temperature" },
      correlation: { streams, method: "pearson" },
    };

    const runResult = await client.query(
      `INSERT INTO analysis_runs
        (user_id, dataset_id, streams, settings)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, datasetId, JSON.stringify(streams), JSON.stringify(settings)],
    );

    const runId = runResult.rows[0].id;

    const alerts = [
      {
        timestamp: "2026-11-24T10:00:00.000Z",
        alert_type: "POINTWISE_ANOMALY",
        target: { metric: "temperature" },
        method: "isolationforest",
        message: "Unusual temperature detected",
        source: { dataset: "analysis-test-dataset" },
        score: 0.95,
        score_metadata: { threshold: 0.8 },
        severity: "HIGH",
        time_window: { start: "2026-11-24T09:00:00Z" },
        supporting_values: { temperature: 35 },
      },
      {
        timestamp: "2026-11-24T10:05:00.000Z",
        alert_type: "CORRELATION_CHANGE",
        target: { metrics: ["temperature", "humidity"] },
        method: "pearson",
        message: "Correlation change detected",
        source: { dataset: "analysis-test-dataset" },
        score: 0.75,
        score_metadata: { previous_score: 0.2 },
        severity: "MEDIUM",
        time_window: { start: "2026-11-24T09:05:00Z" },
        supporting_values: { temperature: 30, humidity: 60 },
      },
    ];

    for (const alert of alerts) {
      await client.query(
        `INSERT INTO analysis_alerts
          (id, run_id, timestamp, alert_type, target, method,
           message, source, score, score_metadata, severity,
           time_window, supporting_values)
         VALUES
          (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12)`,
        [
          runId,
          alert.timestamp,
          alert.alert_type,
          JSON.stringify(alert.target),
          alert.method,
          alert.message,
          JSON.stringify(alert.source),
          alert.score,
          JSON.stringify(alert.score_metadata),
          alert.severity,
          JSON.stringify(alert.time_window),
          JSON.stringify(alert.supporting_values),
        ],
      );
    }

    const savedRun = await client.query(
      `SELECT user_id, dataset_id, streams, settings
       FROM analysis_runs WHERE id = $1`,
      [runId],
    );

    assert.equal(savedRun.rows.length, 1);
    assert.equal(savedRun.rows[0].user_id, userId);
    assert.equal(savedRun.rows[0].dataset_id, datasetId);
    assert.deepEqual(savedRun.rows[0].streams, streams);
    assert.deepEqual(savedRun.rows[0].settings, settings);

    const savedAlerts = await client.query(
      `SELECT * FROM analysis_alerts
       WHERE run_id = $1 ORDER BY timestamp`,
      [runId],
    );

    assert.equal(savedAlerts.rows.length, 2);
    assert.equal(savedAlerts.rows[0].alert_type, alerts[0].alert_type);
    assert.deepEqual(savedAlerts.rows[0].target, alerts[0].target);
    assert.equal(savedAlerts.rows[0].message, alerts[0].message);
    assert.equal(savedAlerts.rows[0].severity, alerts[0].severity);
    assert.ok(savedAlerts.rows[0].id);

    assert.equal(savedAlerts.rows[1].alert_type, alerts[1].alert_type);
    assert.deepEqual(savedAlerts.rows[1].target, alerts[1].target);
    assert.equal(savedAlerts.rows[1].message, alerts[1].message);
    assert.equal(savedAlerts.rows[1].severity, alerts[1].severity);
    assert.ok(savedAlerts.rows[1].id);
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});
