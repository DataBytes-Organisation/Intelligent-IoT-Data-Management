/**
 * TIMESERIES SERVICE
 * -------------------
 * Now supports BOTH:
 *   - long‑format (CSV ingestion)
 *   - wide‑format (ThingSpeak ingestion)
 */

const TimeseriesRepository = require('../repositories/timeseriesRepository');
const repo = new TimeseriesRepository();

function getThingSpeakDatasetOwnerId() {
  const ownerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  if (!ownerId) {
    throw new Error(
      'THINGSPEAK_DATASET_OWNER_ID is required to access shared ThingSpeak data.'
    );
  }
  return ownerId;
}

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
async function getWideEntriesForDatasetId(datasetId, userId) {
  if (!datasetId) return null;

  const accessibleDatasetId = await repo.getAccessibleDatasetId(
    datasetId,
    userId,
    getThingSpeakDatasetOwnerId()
  );
  if (accessibleDatasetId == null) return null;

  // 1. Try ThingSpeak wide-format first
  const wideRows = await repo.findAllWideByDatasetId(accessibleDatasetId);
  if (wideRows.length > 0) {
    console.log(`Service: returning ${wideRows.length} wide-format rows`);
    return wideRows;
  }

  // 2. Fallback to CSV long-format
  const longCount = await repo.countRowsByDatasetId(accessibleDatasetId);
  if (longCount === 0) return null;

  const longRows = await repo.findAllLongByDatasetId(accessibleDatasetId);
  return pivotLongToWide(longRows);
}

/* -----------------------------
 * MD‑02: Dynamic metric extraction
 * ----------------------------- */
async function getAvailableMetricsForDatasetId(datasetId, userId) {
  if (!datasetId) return null;

  const accessibleDatasetId = await repo.getAccessibleDatasetId(
    datasetId,
    userId,
    getThingSpeakDatasetOwnerId()
  );
  if (accessibleDatasetId == null) return null;

  // Prefer wide-format metrics
  const wideRows = await repo.findAllWideByDatasetId(accessibleDatasetId);
  if (wideRows.length > 0) {
    const sample = wideRows[0];
    return Object.keys(sample).filter(k => k.startsWith("field"));
  }

  // Fallback to long-format metrics
  const longCount = await repo.countRowsByDatasetId(accessibleDatasetId);
  if (longCount === 0) return null;

  return repo.findDistinctMetricsByDatasetId(accessibleDatasetId);
}

/* -----------------------------
 * Filtering (works for both formats)
 * ----------------------------- */
async function filterWideEntriesByMetrics(datasetId, streamNames, userId) {
  const entries = await getWideEntriesForDatasetId(datasetId, userId);
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
  getWideEntriesForDatasetId,
  getAvailableMetricsForDatasetId,
  filterWideEntriesByMetrics,
};
