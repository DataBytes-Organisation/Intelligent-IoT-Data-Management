class SeriesRepository {
  constructor(db) {
    this.db = db;
  }

  async findDataset(datasetName) {
    const q = 'SELECT id FROM datasets WHERE name=$1 LIMIT 1';
    const r = await this.db.query(q, [datasetName]);
    return r.rows[0] || null;
  }

  async fetchRawSeries(datasetId, stream, from, to) {
    const q = `
      SELECT ts, value, quality_flag
      FROM timeseries_long
      WHERE dataset_id = $1 AND metric = $2 AND ts BETWEEN $3 AND $4
      ORDER BY ts;
    `;
    const { rows } = await this.db.query(q, [datasetId, stream, from, to]);
    return rows;
  }

  async fetchBucketedSeries(datasetId, stream, from, to, interval) {
    const bucketExpr = {
      '5min': "date_trunc('minute', ts) - interval '1 minute' * (EXTRACT(minute FROM ts)::int % 5)",
      '15min': "date_trunc('minute', ts) - interval '1 minute' * (EXTRACT(minute FROM ts)::int % 15)",
      '1h': "date_trunc('hour', ts)",
      '6h': "date_trunc('hour', ts) - interval '1 hour' * (EXTRACT(hour FROM ts)::int % 6)"
    }[interval];

    const q = `
      WITH b AS (
        SELECT ${bucketExpr} AS bucket, value
        FROM timeseries_long
        WHERE dataset_id=$1 AND metric=$2 AND ts BETWEEN $3 AND $4
      )
      SELECT bucket AS ts, AVG(value) AS value
      FROM b
      GROUP BY bucket
      ORDER BY bucket;
    `;
    const { rows } = await this.db.query(q, [datasetId, stream, from, to]);
    return rows;
  }

  async insertTimeSeries(datasetId, stream, values) {
    const q = `
      INSERT INTO timeseries_long (dataset_id, metric, ts, value, quality_flag)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      for (const r of values) {
        await client.query(q, [datasetId, stream, r.ts, r.value, r.quality_flag || null]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = SeriesRepository;
