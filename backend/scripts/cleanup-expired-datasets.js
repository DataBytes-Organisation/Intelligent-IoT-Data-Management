const pool = require('../src/db/pool');
const { purgeExpiredDatasets } = require('../src/services/datasetCleanupService');

async function run() {
  try {
    const { deletedCount } = await purgeExpiredDatasets();
    console.log(`Dataset cleanup completed: removed ${deletedCount} expired dataset(s).`);
  } catch (error) {
    console.error('Dataset cleanup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
