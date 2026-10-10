/**
 * src/scripts/injest.js
 * Usage: node src/scripts/injest.js <datasetName> <csvFilePath>
 */
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const pool = require('../db/pool');

async function ingestCsv({ datasetName, filePath }) {
  console.log(`Starting ingestion for dataset=${datasetName}`);

  // Ensure dataset exists
  const ds = await pool.query('SELECT id FROM datasets WHERE name=$1', [datasetName]);
  let datasetId;
  if (ds.rowCount === 0) {
    const ins = await pool.query('INSERT INTO datasets (name) VALUES ($1) RETURNING id', [datasetName]);
    datasetId = ins.rows[0].id;
    console.log('Created dataset id', datasetId);
  } else {
    datasetId = ds.rows[0].id;
  }

  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error('CSV file not found: ' + abs);

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(abs)
      .pipe(csvParser())
      .on('data', (row) => {
        const ts = row.datetime; // use the datetime column
        for (const [key, val] of Object.entries(row)) {
          if (key === 'data_point' || key === 'datetime') continue;
          if (val === undefined || val === null || val === '') continue;
          rows.push({
            ts,
            metric: key,
            value: parseFloat(val),
            quality_flag: 'ok'
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('Parsed rows:', rows.length);

  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let idx = 1;
    for (const r of batch) {
      values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(datasetId, r.metric, r.ts, r.value, r.quality_flag);
    }
    const q = `INSERT INTO timeseries_long (dataset_id, metric, ts, value, quality_flag) VALUES ${values.join(',')}`;
    await pool.query(q, params);
  }

  console.log('Ingestion complete. Inserted', rows.length, 'rows.');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node src/scripts/injest.js <datasetName> <csvFilePath>');
    process.exit(1);
  }
  ingestCsv({ datasetName: args[0], filePath: args[1] })
    .then(() => { console.log('Done'); process.exit(0); })
    .catch(err => { console.error('Failed', err); process.exit(1); });
}

module.exports = ingestCsv;
