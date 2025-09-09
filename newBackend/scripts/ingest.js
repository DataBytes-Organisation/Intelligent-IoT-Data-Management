#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../src/db/pool');

function usage() {
  console.log('Usage: node scripts/ingest.js --file path/to.csv --map mappings/sensor2.json');
  process.exit(1);
}

const args = Object.fromEntries(process.argv.slice(2).reduce((a,x,i,arr)=>{
  if (x.startsWith('--')) a.push([x.slice(2), arr[i+1]]);
  return a;
}, []));
if (!args.file || !args.map) usage();

(async () => {
  const map = JSON.parse(fs.readFileSync(args.map, 'utf8'));
  const file = path.resolve(args.file);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ensure dataset exists
    const dsRes = await client.query(
      'INSERT INTO datasets(name) VALUES($1) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
      [map.datasetName]
    );
    const datasetId = dsRes.rows[0].id;

    // prepare CSV parser
    const parser = fs.createReadStream(file).pipe(parse({ columns: true, skip_empty_lines: true }));
    const tsCol = map.ts_column;
    const entityCol = map.entity_column || null;
    let headerMetrics = null;

    // batch insert
    const batchSize = 1000;
    let batch = [];
    let inserted = 0;

    for await (const row of parser) {
      const ts = row[tsCol];
      if (!ts) continue;
      const entity = entityCol ? (row[entityCol] || null) : null;

      // determine metrics to use
      if (!headerMetrics) {
        const allCols = Object.keys(row);
        const skip = new Set([tsCol, entityCol].filter(Boolean));
        if (map.metrics === 'auto') {
          headerMetrics = allCols.filter(c => !skip.has(c));
        } else {
          headerMetrics = map.metrics; // explicit list
        }
      }

      for (const rawName of headerMetrics) {
        const metricName = (map.renames && map.renames[rawName]) ? map.renames[rawName] : rawName;
        const v = row[rawName];
        const num = v === '' || v == null ? null : Number(v);
        const quality = (v === '' || v == null) ? 'missing' : 'ok';

        batch.push({
          dataset_id: datasetId,
          entity,
          metric: metricName,
          ts,        // let Postgres parse ISO or standard timestamp
          value: Number.isFinite(num) ? num : null,
          quality_flag: quality
        });

        if (batch.length >= batchSize) {
          await flush(client, batch);
          inserted += batch.length;
          batch = [];
        }
      }
    }

    if (batch.length) {
      await flush(client, batch);
      inserted += batch.length;
    }

    await client.query('COMMIT');
    console.log(`Ingest done. Rows inserted: ${inserted}`);
    process.exit(0);
  } catch (e) {
    await pool.query('ROLLBACK');
    console.error('Ingest failed:', e);
    process.exit(1);
  } finally {
    client.release();
  }
})();

async function flush(client, rows) {
  // multi-row insert
  const cols = ['dataset_id','entity','metric','ts','value','quality_flag'];
  const params = [];
  const values = rows.map((r, i) => {
    const off = i*cols.length;
    params.push(r.dataset_id, r.entity, r.metric, r.ts, r.value, r.quality_flag);
    return `($${off+1}, $${off+2}, $${off+3}, $${off+4}, $${off+5}, $${off+6})`;
  }).join(',');
  const sql = `INSERT INTO timeseries_long(${cols.join(',')}) VALUES ${values}`;
  await client.query(sql, params);
}
