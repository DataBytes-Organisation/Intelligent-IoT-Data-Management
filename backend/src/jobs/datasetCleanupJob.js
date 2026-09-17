const {
  purgeExpiredDatasets,
  RECOVERY_WINDOW_DAYS,
} = require('../services/datasetCleanupService');

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MINIMUM_INTERVAL_MS = 60 * 60 * 1000;

function resolveIntervalMs(value = process.env.DATASET_CLEANUP_INTERVAL_MS) {
  if (value === undefined || value === '') return DEFAULT_INTERVAL_MS;

  const intervalMs = Number(value);
  if (!Number.isSafeInteger(intervalMs) || intervalMs < MINIMUM_INTERVAL_MS) {
    throw new Error(
      `DATASET_CLEANUP_INTERVAL_MS must be an integer of at least ${MINIMUM_INTERVAL_MS}`
    );
  }

  return intervalMs;
}

/**
 * Start the optional application-hosted cleanup schedule.
 *
 * Production deployments may instead run `npm run cleanup:expired-datasets`
 * from their platform scheduler. This is disabled unless explicitly enabled,
 * so local development cannot unexpectedly remove expired fixtures.
 */
function startDatasetCleanupJob({
  enabled = process.env.DATASET_CLEANUP_ENABLED === 'true',
  intervalMs = resolveIntervalMs(),
  purge = purgeExpiredDatasets,
  logger = console,
} = {}) {
  if (!enabled) {
    return { stop() {} };
  }

  let running = false;

  const run = async () => {
    if (running) return;

    running = true;
    try {
      const { deletedCount } = await purge();
      logger.info(
        `Dataset cleanup completed: removed ${deletedCount} dataset(s) whose ${RECOVERY_WINDOW_DAYS}-day recovery window expired.`
      );
    } catch (error) {
      logger.error('Dataset cleanup failed:', error.message);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, intervalMs);
  timer.unref();

  return {
    stop() {
      clearInterval(timer);
    },
  };
}

module.exports = {
  DEFAULT_INTERVAL_MS,
  MINIMUM_INTERVAL_MS,
  resolveIntervalMs,
  startDatasetCleanupJob,
};
