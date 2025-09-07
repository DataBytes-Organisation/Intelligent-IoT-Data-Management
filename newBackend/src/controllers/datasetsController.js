const pool = require('../db/pool');

exports.listDatasets = async (_req, res) => {
  const q = await pool.query('SELECT id, name FROM datasets ORDER BY id');
  res.json({ items: q.rows.map(r => ({ id: r.name, name: r.name })) }); // use name as route id
};

exports.datasetMeta = async (req, res) => {
  const datasetName = req.params.id;
  const ds = await pool.query('SELECT id FROM datasets WHERE name=$1', [datasetName]);
  if (ds.rowCount === 0) return res.status(404).json({ code:'not_found', message:'dataset not found' });
  const datasetId = ds.rows[0].id;

  const fieldsQ = await pool.query('SELECT DISTINCT metric FROM timeseries_long WHERE dataset_id=$1 ORDER BY metric', [datasetId]);
  const boundsQ = await pool.query('SELECT MIN(ts) AS start, MAX(ts) AS end FROM timeseries_long WHERE dataset_id=$1', [datasetId]);

  res.json({
    datasetId: datasetName,
    fieldCount: fieldsQ.rowCount,
    fields: fieldsQ.rows.map(r => r.metric),
    timeBounds: { start: boundsQ.rows[0].start, end: boundsQ.rows[0].end }
  });
};
