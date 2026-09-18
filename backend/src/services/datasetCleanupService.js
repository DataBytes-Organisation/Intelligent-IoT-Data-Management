const pool = require('../db/pool');

const RECOVERY_WINDOW_DAYS = 15;

/**
 * Permanently remove dataset configurations whose recovery window has expired.
 *
 * Time-series rows should already have been removed when the dataset was
 * soft-deleted. Deleting the dataset row also invokes the database foreign-key
 * cascades, so any retained field mappings (and any unexpected orphaned
 * time-series rows) are removed atomically with the dataset.
 */
async function purgeExpiredDatasets(db = pool) {
  const result = await db.query(`
    DELETE FROM datasets
    WHERE deleted_at IS NOT NULL
      AND deleted_at <= CURRENT_TIMESTAMP - INTERVAL '${RECOVERY_WINDOW_DAYS} days'
    RETURNING id
  `);

  return {
    deletedCount: result.rowCount,
    datasetIds: result.rows.map((row) => row.id),
  };
}

module.exports = {
  RECOVERY_WINDOW_DAYS,
  purgeExpiredDatasets,
};
