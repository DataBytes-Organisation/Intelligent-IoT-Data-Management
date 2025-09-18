const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');  // npm install csv-parser
const pool = require('./db/pool');

async function ingestCsv({ datasetName, metric, filePath }) {
  console.log(`📥 Starting ingestion for dataset=${datasetName}, metric=${metric}`);

  // 1. Resolve dataset_id (create if not exists)
  let datasetRes = await pool.query('SELECT id FROM datasets WHERE name=$1', [datasetName]);
  let datasetId;

  if (datasetRes.rowCount === 0) {
    const insertRes = await pool.query(
      'INSERT INTO datasets (name) VALUES ($1) RETURNING id',
      [datasetName]
    );
    datasetId = insertRes.rows[0].id;
    console.log(`🆕 Created dataset '${datasetName}' with id=${datasetId}`);
  } else {
    datasetId = datasetRes.rows[0].id;
    console.log(`✅ Found dataset '${datasetName}' with id=${datasetId}`);
  }

  // 2. Read and parse CSV file
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`CSV file not found: ${absPath}`);
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(absPath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Expecting CSV headers: ts, value, quality_flag
        if (!row.ts || !row.value) return;
        rows.push({
          ts: new Date(row.ts),
          value: parseFloat(row.value),
          quality_flag: row.quality_flag ? row.quality_flag : null,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Parsed ${rows.length} rows from CSV`);

  // 3. Insert into timeseries_long
  const insertQuery = `
    INSERT INTO timeseries_long (dataset_id, metric, ts, value, quality_flag)
    VALUES ($1, $2, $3, $4, $5)
  `;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const r of rows) {
      await client.query(insertQuery, [
        datasetId,
        metric,
        r.ts,
        r.value,
        r.quality_flag,
      ]);
    }

    await client.query('COMMIT');
    console.log(`✅ Inserted ${rows.length} rows into timeseries_long`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Ingestion failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run from CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node injest.js <datasetName> <metric> <csvFilePath>');
    process.exit(1);
  }

  const [datasetName, metric, filePath] = args;

  ingestCsv({ datasetName, metric, filePath })
    .then(() => {
      console.log('🎉 Ingestion complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('🚨 Ingestion failed:', err);
      process.exit(1);
    });
}

module.exports = ingestCsv;
