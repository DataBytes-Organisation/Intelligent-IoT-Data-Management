const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { randomUUID } = require("node:crypto");

require("dotenv").config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is required");
}

const pool = new Pool({ connectionString: TEST_DATABASE_URL });

// Run both BE-01 migrations in order.
const migrationPaths = [
  path.join(
    __dirname,
    "../../src/db/migrations/005_analysis_runs_and_alerts.sql",
  ),
  path.join(__dirname, "../../src/db/migrations/006_extend_analysis_runs.sql"),
];

const analysisRepository = require("../../src/repositories/analysisRepository");

test.after(async () => {
  await pool.end();
});

test("analysis runs and alerts can be saved and read back", async () => {
  const client = await pool.connect();
  const schemaName = `analysis_test_${randomUUID().replace(/-/g, "")}`;

  try {
    await client.query("BEGIN");

    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

    // Create the minimum parent tables required by the migrations.
    await client.query(`
      CREATE TABLE auth_users (
        id UUID PRIMARY KEY
      );

      CREATE TABLE datasets (
        id SERIAL PRIMARY KEY
      );
    `);

    const userId = randomUUID();

    await client.query("INSERT INTO auth_users (id) VALUES ($1)", [userId]);
    await client.query("INSERT INTO datasets (id) VALUES ($1)", [42]);

    // Run the actual BE-01 migrations in order.
    for (const migrationPath of migrationPaths) {
      const migrationSql = fs.readFileSync(migrationPath, "utf8");
      await client.query(migrationSql);
    }

    const streams = ["temperature", "humidity"];

    const settings = {
      model: { metric: "temperature" },
      correlation: { method: "pearson" },
    };

    const alerts = [
      {
        timestamp: "2026-08-27T00:00:00.000Z",
        alert_type: "POINTWISE_ANOMALY",
        target: { metric: "temperature" },
        method: "isolationforest",
        message: "Temperature anomaly detected",
        source: { service: "analytics" },
        score: 0.95,
        score_metadata: { threshold: 0.8 },
        severity: "HIGH",
        time_window: { start: "2026-08-27T00:00:00.000Z" },
        supporting_values: { temperature: 35.5 },
      },
      {
        timestamp: "2026-08-27T00:01:00.000Z",
        alert_type: "CORRELATION_CHANGE",
        target: { streams: ["temperature", "humidity"] },
        method: "pearson",
        message: "Correlation change detected",
        source: { service: "analytics" },
        score: 0.75,
        score_metadata: { threshold: 0.7 },
        severity: "MEDIUM",
        time_window: { start: "2026-08-27T00:01:00.000Z" },
        supporting_values: { correlation: 0.75 },
      },
    ];

    // Pass the test's database client to the repository.
    const saved = await analysisRepository.saveAnalysisRun({
      userId,
      datasetId: 42,
      datasetName: "Test Dataset",
      streams,
      settings,
      request: { datasetId: 42 },
      result: { status: "success", alerts },
      status: "success",
      contractVersion: "1.0",
      generatedAt: new Date().toISOString(),
      alerts,
      client,
    });

    // Read back the saved analysis run.
    const runResult = await client.query(
      `SELECT user_id, dataset_id, streams, settings,
              dataset_name, request, result, status,
              contract_version, generated_at
       FROM analysis_runs
       WHERE id = $1`,
      [saved.runId],
    );

    assert.equal(runResult.rows.length, 1);
    assert.equal(runResult.rows[0].user_id, userId);
    assert.equal(runResult.rows[0].dataset_id, 42);
    assert.deepEqual(runResult.rows[0].streams, streams);
    assert.deepEqual(runResult.rows[0].settings, settings);

    // Read back the saved alerts.
    const alertResult = await client.query(
      `SELECT *
       FROM analysis_alerts
       WHERE run_id = $1
       ORDER BY timestamp`,
      [saved.runId],
    );

    assert.equal(alertResult.rows.length, 2);

    for (let i = 0; i < alerts.length; i++) {
      const actual = alertResult.rows[i];
      const expected = alerts[i];

      assert.equal(actual.timestamp.toISOString(), expected.timestamp);
      assert.equal(actual.alert_type, expected.alert_type);
      assert.deepEqual(actual.target, expected.target);
      assert.equal(actual.method, expected.method);
      assert.equal(actual.message, expected.message);
      assert.deepEqual(actual.source, expected.source);
      assert.equal(Number(actual.score), expected.score);
      assert.deepEqual(actual.score_metadata, expected.score_metadata);
      assert.equal(actual.severity, expected.severity);
      assert.deepEqual(actual.time_window, expected.time_window);
      assert.deepEqual(actual.supporting_values, expected.supporting_values);
      assert.equal(actual.id, saved.alerts[i].alert_id);
    }
  } finally {
    // Roll back all test data and remove the temporary schema.
    await client.query("ROLLBACK");
    client.release();
  }
});
