const pool = require('../db/pool');

const INTERVALS = new Set(['raw','5min','15min','1h','6h']);

exports.getSeries = async (req, res) => {
  const { datasetId, stream, interval='raw', from, to } = req.query;
  if (!datasetId || !stream || !from || !to) {
    return res.status(400).json({ code:'bad_request', message:'datasetId, stream, from, to required' });
  }
  if (!INTERVALS.has(interval)) {
    return res.status(400).json({ code:'bad_interval', message:'use raw, 5min, 15min, 1h, 6h' });
  }

  const ds = await pool.query('SELECT id FROM datasets WHERE name=$1', [datasetId]);
  if (ds.rowCount === 0) return res.status(404).json({ code:'not_found', message:'dataset not found' });
  const id = ds.rows[0].id;

  let rows;
  if (interval === 'raw') {
    const q = `
      SELECT ts, value
      FROM timeseries_long
      WHERE dataset_id=$1 AND metric=$2 AND ts BETWEEN $3 AND $4
      ORDER BY ts
    `;
    rows = (await pool.query(q, [id, stream, from, to])).rows;
  } else {
    const bucketExpr = ({
      '5min': `date_trunc('minute', ts) - make_interval(mins => EXTRACT(minute FROM ts)::int % 5)`,
      '15min': `date_trunc('minute', ts) - make_interval(mins => EXTRACT(minute FROM ts)::int % 15)`,
      '1h': `date_trunc('hour', ts)`,
      '6h': `date_trunc('hour', ts) - make_interval(hours => EXTRACT(hour FROM ts)::int % 6)`
    })[interval];

    const q = `
      WITH b AS (
        SELECT ${bucketExpr} AS bucket, value
        FROM timeseries_long
        WHERE dataset_id=$1 AND metric=$2 AND ts BETWEEN $3 AND $4
      )
      SELECT bucket AS ts, AVG(value) AS value
      FROM b
      GROUP BY bucket
      ORDER BY bucket
    `;
    rows = (await pool.query(q, [id, stream, from, to])).rows;
  }

  res.json({ datasetId, stream, interval, from, to, series: rows });
};
