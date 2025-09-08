const pool = require('../db/pool');

// GET /api/timestamps?datasetId=sensor1&limit=1000
// Returns: { timestamps: ["2025-03-18T06:54:26.000Z", ...] }
exports.listTimestamps = async (req, res) => {
  const { datasetId, limit } = req.query;
  if (!datasetId) {
    return res.status(400).json({ code: 'bad_request', message: 'datasetId is required' });
  }

  const lim = Math.min(Math.max(parseInt(limit || '1000', 10), 1), 10000); // 1..10000

  const ds = await pool.query('SELECT id FROM datasets WHERE name=$1', [datasetId]);
  if (ds.rowCount === 0) {
    return res.status(404).json({ code: 'not_found', message: 'dataset not found' });
  }
  const id = ds.rows[0].id;

  // Distinct timestamps ordered; capped by "limit"
  const q = `
    SELECT DISTINCT ts
    FROM timeseries_long
    WHERE dataset_id = $1
    ORDER BY ts
    LIMIT $2
  `;
  const { rows } = await pool.query(q, [id, lim]);

  res.json({ timestamps: rows.map(r => r.ts.toISOString()) });
};
