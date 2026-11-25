
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is required to run the analytics alerts migration integration test"
  );
}

const pool = new Pool({
  connectionString: TEST_DATABASE_URL,
});

const migrationPath = path.join(
  __dirname,
  "../../src/db/migrations/005_create_analytics_alerts.sql"
);

test.after(async () => {
  await pool.end();
});

test(
  "analytics alerts migration creates the table, stores alerts, preserves dataset history, and is repeatable",
  async () => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Create an isolated schema for this test.
      await client.query(`
        CREATE SCHEMA analytics_alerts_migration_test;

        SET LOCAL search_path TO analytics_alerts_migration_test, public;

        CREATE TABLE auth_users (
          id UUID PRIMARY KEY
        );

        CREATE TABLE datasets (
          id SERIAL PRIMARY KEY
        );
      `);

      // Create test user and dataset.
      const userId = "11111111-1111-4111-8111-111111111111";

      const userResult = await client.query(
        "INSERT INTO auth_users (id) VALUES ($1) RETURNING id",
        [userId]
      );

      const datasetResult = await client.query(
        "INSERT INTO datasets DEFAULT VALUES RETURNING id"
      );

      const datasetId = datasetResult.rows[0].id;

      const migrationSql = fs.readFileSync(
        migrationPath,
        "utf8"
      );

      // First migration run.
      await client.query(migrationSql);

      // Verify that the table exists.
      const tableResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'analytics_alerts_migration_test'
          AND table_name = 'analytics_alerts'
      `);

      assert.equal(tableResult.rows.length, 1);

      // Verify that the migration can run a second time.
      await client.query(migrationSql);

      // Insert a sample analytics alert.
      const alert = {
        timestamp: "2026-11-25T02:00:00.000Z",
        alert_type: "POINTWISE_ANOMALY",
        target: { sensor_id: "sensor-001" },
        method: "z_score",
        score: 3.5,
        score_metadata: { threshold: 3.0 },
        severity: "high",
        message: "Unusual temperature detected",
        time_window: { start: "2026-11-25T01:00:00Z" },
        supporting_values: { temperature: 45.2 },
        source: { service: "analytics" },
      };

      const insertResult = await client.query(
        `
          INSERT INTO analytics_alerts (
            user_id,
            dataset_id,
            alert_timestamp,
            alert_type,
            target,
            method,
            score,
            score_metadata,
            severity,
            message,
            time_window,
            supporting_values,
            source,
            alert_data
          )
          VALUES (
            $1, $2, $3, $4, $5::jsonb, $6, $7,
            $8::jsonb, $9, $10, $11::jsonb,
            $12::jsonb, $13::jsonb, $14::jsonb
          )
          RETURNING *
        `,
        [
          userResult.rows[0].id,
          datasetId,
          alert.timestamp,
          alert.alert_type,
          JSON.stringify(alert.target),
          alert.method,
          alert.score,
          JSON.stringify(alert.score_metadata),
          alert.severity,
          alert.message,
          JSON.stringify(alert.time_window),
          JSON.stringify(alert.supporting_values),
          JSON.stringify(alert.source),
          JSON.stringify(alert),
        ]
      );

      assert.equal(insertResult.rows.length, 1);
      assert.equal(insertResult.rows[0].user_id, userId);
      assert.equal(insertResult.rows[0].dataset_id, datasetId);
      assert.equal(
        insertResult.rows[0].alert_type,
        "POINTWISE_ANOMALY"
      );
      assert.equal(
        insertResult.rows[0].message,
        "Unusual temperature detected"
      );
      assert.equal(
        insertResult.rows[0].alert_data.alert_type,
        "POINTWISE_ANOMALY"
      );

      // Delete the dataset. The historical alert should remain.
      await client.query(
        "DELETE FROM datasets WHERE id = $1",
        [datasetId]
      );

      const preservedAlert = await client.query(
        `
          SELECT dataset_id, message
          FROM analytics_alerts
          WHERE id = $1
        `,
        [insertResult.rows[0].id]
      );

      assert.equal(preservedAlert.rows.length, 1);
      assert.equal(preservedAlert.rows[0].dataset_id, null);
      assert.equal(
        preservedAlert.rows[0].message,
        "Unusual temperature detected"
      );

      // Verify all three custom indexes exist.
      const indexResult = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'analytics_alerts_migration_test'
            AND tablename = 'analytics_alerts'
      `);

        const indexNames = indexResult.rows.map((row) => row.indexname);

        assert.ok(indexNames.includes("idx_analytics_alerts_user_created"));
        assert.ok(indexNames.includes("idx_analytics_alerts_dataset_timestamp"));
        assert.ok(indexNames.includes("idx_analytics_alerts_type_timestamp"));

    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  }
);
