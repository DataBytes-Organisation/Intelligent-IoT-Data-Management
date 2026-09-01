/**
 * ANALYSE SERVICE
 * ----------------
 * Reads persisted dataset rows from PostgreSQL,
 * normalises them, prepares the Correlation payload,
 * and calls the Correlation service.
 */

const TimeseriesRepository =
  require('../repositories/timeseriesRepository');

const {
  normalizeThingSpeakFeed
} = require('./sensorFieldNormalizer');

const {
  callCorrelation
} = require('./analyticsClientService');

const repo = new TimeseriesRepository();

const DATASET_CHANNELS = {
  'thingspeak-live': 12397,
  'thingspeak-co2': 1350261,
};

/**
 * Convert persisted wide-format database rows
 * into canonical sensor values.
 */
function transformRowsForAnalytics(rows, channelId) {
  return rows.map((row) => {
    const normalized =
      normalizeThingSpeakFeed(channelId, row);

    const {
      channel_id,
      entry_id,
      recorded_at,
      ...values
    } = normalized;

    return {
      timestamp: recorded_at,
      entry_id,
      values,
    };
  });
}

/**
 * Build the flat payload required by
 * the Correlation service.
 */
function buildCorrelationPayload(
  series,
  selectedStreams,
  options = {}
) {
  if (
    !Array.isArray(selectedStreams) ||
    selectedStreams.length < 2
  ) {
    throw new Error(
      'At least two selectedStreams are required'
    );
  }

  const data = series.map((item) => {
    const row = {
      timestamp: item.timestamp,
    };

    for (const stream of selectedStreams) {
      row[stream] =
        item.values[stream] ?? null;
    }

    return row;
  });

  return {
    data,
    timestamp_col: 'timestamp',
    selected_streams: selectedStreams,
    window_size: options.windowSize || 20,
    step_size: options.stepSize || 10,
    method: options.method || 'pearson',
  };
}

/**
 * Read persisted PostgreSQL data and
 * execute Correlation analysis.
 */
async function runAnalysis(payload) {
  const datasetName =
    payload.datasetName || payload.dataset;

  if (!datasetName) {
    throw new Error('Dataset name is required');
  }

  const channelId =
    DATASET_CHANNELS[datasetName];

  if (!channelId) {
    throw new Error(
      `No ThingSpeak channel mapping configured for dataset: ${datasetName}`
    );
  }

  const datasetId =
    await repo.getDatasetIdByName(datasetName);

  if (!datasetId) {
    throw new Error(
      `Dataset not found: ${datasetName}`
    );
  }

  const rows =
    await repo.findAllWideByDatasetId(datasetId);

  if (!rows || rows.length === 0) {
    throw new Error(
      `No persisted rows found for dataset: ${datasetName}`
    );
  }

  const series =
    transformRowsForAnalytics(rows, channelId);

  const selectedStreams =
    payload.selectedStreams;

  const correlationPayload =
    buildCorrelationPayload(
      series,
      selectedStreams,
      {
        windowSize: payload.windowSize,
        stepSize: payload.stepSize,
        method: payload.method,
      }
    );

  const correlationResult =
    await callCorrelation(correlationPayload);

  return {
    dataset: datasetName,
    dataset_id: datasetId,
    channel_id: channelId,
    row_count: series.length,
    selected_streams: selectedStreams,
    correlation: correlationResult,
    status: 'correlation analysis completed',
  };
}

module.exports = {
  runAnalysis,
  transformRowsForAnalytics,
  buildCorrelationPayload,
};