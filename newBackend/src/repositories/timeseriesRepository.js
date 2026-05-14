/**
 * TIMESERIES REPOSITORY
 * ----------------------
 * Handles all database operations for BOTH:
 *   - long‑format time‑series rows (CSV ingestion)
 *   - wide‑format time‑series rows (ThingSpeak ingestion)
 *
 * Tables:
 *   - datasets
 *   - timeseries_long   (long format)
 *   - timeseries        (wide format)
 */

const pool = require('../db/pool');
const TimeSeriesWide = require("../models/timeSeriesWide");

class TimeseriesRepository {

  /* -----------------------------
   * SHARED: Dataset lookup
   * ----------------------------- */
  async getDatasetIdByName(name) {
    const result = await pool.query(
      `SELECT id FROM datasets WHERE name = $1`,
      [name]
    );
    return result.rows[0]?.id ?? null;
  }

  /* -----------------------------
   * LONG FORMAT (CSV ingestion)
   * ----------------------------- */
  async countRowsByDatasetId(datasetId) {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM timeseries_long
       WHERE dataset_id = $1`,
      [datasetId]
    );
    return Number(result.rows[0].count);
  }

  async findAllLongByDatasetId(datasetId) {
    const result = await pool.query(
      `SELECT ts, entity, metric, value
       FROM timeseries_long
       WHERE dataset_id = $1
       ORDER BY ts ASC`,
      [datasetId]
    );
    return result.rows;
  }

  async findDistinctMetricsByDatasetId(datasetId) {
    const result = await pool.query(
      `SELECT DISTINCT metric
       FROM timeseries_long
       WHERE dataset_id = $1
       ORDER BY metric ASC`,
      [datasetId]
    );
    return result.rows.map(r => r.metric);
  }

  /* -----------------------------
   * WIDE FORMAT (ThingSpeak ingestion)
   * ----------------------------- */

  // Insert a wide-format row dynamically
  async insertWideRow(datasetId, createdAt, entryId, fields) {
    const metricKeys = Object.keys(fields); // ["field1", "field2", ...]

    const columns = ["dataset_id", "created_at", "entry_id", ...metricKeys];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    const values = [
      datasetId,
      createdAt,
      entryId,
      ...metricKeys.map(k => fields[k] ?? null)
    ];

    const query = `
      INSERT INTO timeseries (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (dataset_id, entry_id) DO NOTHING
    `;

    console.log(`Repository: inserting wide row entry_id=${entryId}`);
    await pool.query(query, values);
  }

  // Fetch all wide-format rows for API
  async findAllWideByDatasetId(datasetId) {
    const result = await pool.query(
      `SELECT *
       FROM timeseries
       WHERE dataset_id = $1
       ORDER BY created_at ASC`,
      [datasetId]
    );

    // Convert each row into a TimeSeriesWide model instance
    return result.rows.map(row => new TimeSeriesWide(row));
  }
}

module.exports = TimeseriesRepository;
