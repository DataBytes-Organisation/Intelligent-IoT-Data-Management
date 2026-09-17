const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../db/pool');

async function ingest(csvFile, mappingFile) {
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

  const timestampCol = mapping.timestamp;
  const entityCol = mapping.entity;

  const rows = [];
  const headerColumns = [];

  // Read CSV
  await new Promise((resolve) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('headers', (headers) => {
        headers.forEach(h => headerColumns.push(h));
      })
      .on('data', (data) => rows.push(data))
      .on('end', resolve);
  });

  // Detect metrics
  let metrics = [];
  if (mapping.metrics === 'auto') {
    metrics = headerColumns.filter(
      col => col !== timestampCol && col !== entityCol
    );
  } else {
    metrics = mapping.metrics;
  }

  // Create dataset
  const datasetName = mapping.datasetName || csvFile;
  const ownerUserId = mapping.ownerUserId;
  if (!ownerUserId) {
    throw new Error('mapping.ownerUserId is required to create a dataset.');
  }

  const datasetResult = await pool.query(
    `INSERT INTO datasets (name, created_by, updated_by)
     VALUES ($1, $2, $2)
     ON CONFLICT (created_by, name) WHERE deleted_at IS NULL
     DO UPDATE SET updated_by = EXCLUDED.updated_by,
                   updated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [datasetName, ownerUserId]
  );

  const datasetId = datasetResult.rows[0].id;

  // Insert time-series rows
  for (const row of rows) {
    const ts = row[timestampCol];
    const entity = row[entityCol];

    for (const metric of metrics) {
      const value = row[metric];

      await pool.query(
        `INSERT INTO timeseries_long
         (dataset_id, entity, metric, ts, value, quality_flag)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [datasetId, entity, metric, ts, value, 'good']
      );
    }
  }

  console.log('Ingestion complete.');
  await pool.end();
}

// CLI usage
const csvFile = process.argv[2];
const mappingFile = process.argv[3];

if (!csvFile || !mappingFile) {
  console.error('Usage: node dataIngestion/inject.js <csvFile> <mappingFile>');
  process.exit(1);
}

ingest(csvFile, mappingFile);
