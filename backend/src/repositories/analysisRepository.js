const db = require("../db/pool");

class AnalysisRepository {
  async saveAnalysisRun({
    userId,
    datasetId = null,
    datasetName = null,
    streams = [],
    settings = {},
    request = {},
    result = {},
    status,
    contractVersion = null,
    generatedAt = null,
    alerts = [],
    client: providedClient,
  }) {
    const client = providedClient || (await db.connect());
    const ownsClient = !providedClient;

    try {
      if (ownsClient) {
        await client.query("BEGIN");
      }

      const runResult = await client.query(
        `INSERT INTO analysis_runs
          (
            user_id,
            dataset_id,
            dataset_name,
            streams,
            settings,
            request,
            result,
            status,
            contract_version,
            generated_at
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          userId,
          datasetId,
          datasetName,
          JSON.stringify(streams),
          JSON.stringify(settings),
          JSON.stringify(request),
          JSON.stringify(result),
          status,
          contractVersion,
          generatedAt,
        ],
      );

      const runId = runResult.rows[0].id;
      const savedAlerts = [];

      for (const alert of alerts) {
        const alertResult = await client.query(
          `INSERT INTO analysis_alerts
            (
              id,
              run_id,
              timestamp,
              alert_type,
              target,
              method,
              message,
              source,
              score,
              score_metadata,
              severity,
              time_window,
              supporting_values
            )
           VALUES
            (
              COALESCE($1::uuid, gen_random_uuid()),
              $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13
            )
           RETURNING id`,
          [
            alert.alert_id ?? null,
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
