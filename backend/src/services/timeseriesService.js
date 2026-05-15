/**
 * TIMESERIES SERVICE
 * -------------------
 * Now supports BOTH:
 *   - long‑format (CSV ingestion)
 *   - wide‑format (ThingSpeak ingestion)
 */

const TimeseriesRepository = require('../repositories/timeseriesRepository');
const repo = new TimeseriesRepository();

/* -----------------------------
 * Helpers
 * ----------------------------- */
function tsToIso(ts) {
  if (ts instanceof Date) return ts.toISOString();
  return String(ts);
}

/* -----------------------------
 * Long → Wide Pivot (CSV only)
 * ----------------------------- */
function pivotLongToWide(rows) {
  const groups = new Map();

  for (const row of rows) {
    const key = `${tsToIso(row.ts)}|${row.entity ?? ''}`;
    let entry = groups.get(key);

    if (!entry) {
      const entity = row.entity;
      let entryId = entity;

      if (
        entity !== null &&
        entity !== undefined &&
        /^\d+$/.test(String(entity).trim())
      ) {
        entryId = Number(String(entity).trim());
      }

      entry = {
        created_at: tsToIso(row.ts),
        entry_id: entryId,
      };

      groups.set(key, entry);
    }

    entry[row.metric] = row.value;
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

/* -----------------------------
 * MD‑02: Wide-format support
 * ----------------------------- */
async function getWideEntriesForDatasetName(datasetName) {
  if (!datasetName) return null;

  const datasetId = await repo.getDatasetIdByName(datasetName);
  if (datasetId == null) return null;

  // 1. Try ThingSpeak wide-format first
  const wideRows = await repo.findAllWideByDatasetId(datasetId);
  if (wideRows.length > 0) {
    console.log(`Service: returning ${wideRows.length} wide-format rows`);
    return wideRows;
  }

  // 2. Fallback to CSV long-format
  const longCount = await repo.countRowsByDatasetId(datasetId);
  if (longCount === 0) return null;

  const longRows = await repo.findAllLongByDatasetId(datasetId);
  return pivotLongToWide(longRows);
}

/* -----------------------------
 * MD‑02: Dynamic metric extraction
 * ----------------------------- */
async function getAvailableMetricsForDatasetName(datasetName) {
  if (!datasetName) return null;

  const datasetId = await repo.getDatasetIdByName(datasetName);
  if (datasetId == null) return null;

  // Prefer wide-format metrics
  const wideRows = await repo.findAllWideByDatasetId(datasetId);
  if (wideRows.length > 0) {
    const sample = wideRows[0];
    return Object.keys(sample).filter(k => k.startsWith("field"));
  }

  // Fallback to long-format metrics
  const longCount = await repo.countRowsByDatasetId(datasetId);
  if (longCount === 0) return null;

  return repo.findDistinctMetricsByDatasetId(datasetId);
}

/* -----------------------------
 * Filtering (works for both formats)
 * ----------------------------- */
async function filterWideEntriesByMetrics(datasetName, streamNames) {
  const entries = await getWideEntriesForDatasetName(datasetName);
  if (!entries) return null;

  return entries.map(entry => {
    const filtered = {
      created_at: entry.created_at,
      entry_id: entry.entry_id,
    };

    for (const name of streamNames) {
      if (entry[name] !== undefined) {
        filtered[name] = entry[name];
      }
    }

    return filtered;
  });
}

module.exports = {
  pivotLongToWide,
  getWideEntriesForDatasetName,
  getAvailableMetricsForDatasetName,
  filterWideEntriesByMetrics,
};
