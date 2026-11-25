
const db = require("../db/pool");

class AnalyticsAlertRepository {
  /**
   * Save a batch of analytics alerts permanently.
   * All alerts are saved in one transaction.
   */
  async createMany({ alerts, userId, datasetId = null }) {
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return [];
    }

    if (!userId) {
      throw new Error("A user ID is required to persist analytics alerts.");
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const savedAlerts = [];

      for (const alert of alerts) {
        const result = await client.query(
          `
          WITH generated AS (
            SELECT gen_random_uuid() AS id
          )
          INSERT INTO analytics_alerts (
            id,
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
          SELECT
            generated.id,
            $1,
            $2,
            $3,
            $4,
            $5::jsonb,
            $6,
            $7,
            $8::jsonb,
            $9,
            $10,
            $11::jsonb,
            $12::jsonb,
            $13::jsonb,
            $14::jsonb || jsonb_build_object(
              'alert_id',
              generated.id::text
            )
          FROM generated
          RETURNING id
          `,
          [
            userId,
            datasetId,
            alert.timestamp,
            alert.alert_type,
            JSON.stringify(alert.target),
            alert.method,
            alert.score ?? null,
            alert.score_metadata == null
              ? null
              : JSON.stringify(alert.score_metadata),
            alert.severity ?? null,
            alert.message,
            alert.time_window == null
              ? null
              : JSON.stringify(alert.time_window),
            alert.supporting_values == null
              ? null
              : JSON.stringify(alert.supporting_values),
            JSON.stringify(alert.source),
            JSON.stringify(alert),
          ],
        );

        const alertId = result.rows[0].id;

        savedAlerts.push({
          ...alert,
          alert_id: alertId,
        });
      }

      await client.query("COMMIT");

      return savedAlerts;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new AnalyticsAlertRepository();
