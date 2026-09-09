const cron = require('node-cron');
const db = require('../db');

function startCleanupScheduler() {
  // Runs daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily dataset cleanup purge...');
    try {
      const result = await db.query('SELECT * FROM purge_expired_datasets();');
      console.log(`[Scheduler] Purge complete. Datasets removed: ${result.rowCount}`);
    } catch (error) {
      console.error('[Scheduler Error] Daily dataset purge failed:', error);
    }
  });

  console.log('[Scheduler] Daily cleanup job initialized.');
}

module.exports = { startCleanupScheduler };