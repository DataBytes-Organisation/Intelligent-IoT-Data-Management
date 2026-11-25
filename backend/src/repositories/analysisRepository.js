const db = require("../db/pool");

class AnalysisRepository {
  async saveAnalysisRun({
    userId,
    datasetId,
    streams,
    settings,
    alerts,
    client: providedClient,
  }) {
    // Use the test's client if provided; otherwise create our own.
    const client = providedClient || (await db.connect());
    const ownsClient = !providedClient;

    try {
      // Only manage the transaction when this repository owns the connection.
      if (ownsClient) {
        await client.query("BEGIN");
      }

      const runResult = await client.query(
        `INSERT INTO analysis_runs
          (user_id, dataset_id, streams, settings)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          userId,
          datasetId,
          JSON.stringify(streams || []),
          JSON.stringify(settings || {}),
        ],
      );

      const runId = runResult.rows[0].id;
      const savedAlerts = [];

      for (const alert of alerts || []) {
        const alertResult = await client.query(
          `INSERT INTO analysis_alerts
            (id, run_id, timestamp, alert_type, target, method,
             message, source, score, score_metadata, severity,
             time_window, supporting_values)
           VALUES
            (gen_random_uuid(), $1, $2, $3, $4, $5,
             $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            runId,
            alert.timestamp,
            alert.alert_type,
            JSON.stringify(alert.target),
            alert.method,
            alert.message,
            JSON.stringify(alert.source),
            alert.score ?? null,
            alert.score_metadata == null
              ? null
              : JSON.stringify(alert.score_metadata),
            alert.severity ?? null,
            alert.time_window == null
              ? null
              : JSON.stringify(alert.time_window),
            alert.supporting_values == null
              ? null
              : JSON.stringify(alert.supporting_values),
          ],
        );

        savedAlerts.push({
          ...alert,
          alert_id: alertResult.rows[0].id,
        });
      }

      if (ownsClient) {
        await client.query("COMMIT");
      }

      return {
        runId,
        alerts: savedAlerts,
      };
    } catch (error) {
      if (ownsClient) {
        await client.query("ROLLBACK");
      }
      throw error;
    } finally {
      if (ownsClient) {
        client.release();
      }
    }
  }
}

module.exports = new AnalysisRepository();
