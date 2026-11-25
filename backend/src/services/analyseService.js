const timeseriesService = require('./timeseriesService');
const datasetRepository = require('../repositories/datasetRepository');
const analyticsAlertRepository = require('../repositories/analyticsAlertRepository');
const {
  fieldMapForChannel,
  fieldMapFromMappings,
} = require('./thingSpeakFieldMappings');

const DEFAULT_TIMEOUT_MS = 15_000;

function staticMappingForDataset(dataset) {
  // Named historical/parallel channel datasets can be normalised without a
  // database lookup. The active `thingspeak-live` dataset must use its saved
  // dataset_field_mappings record instead.
  const channelId = /^thingspeak-(\d+)$/.exec(dataset || '')?.[1];
  return channelId ? fieldMapForChannel(channelId) || {} : {};
}

class AnalysisServiceError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'AnalysisServiceError';
    this.status = status || 500;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
  }
}

function analyticsUrl() {
  return (process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5002').replace(/\/$/, '');
}

function analyticsTimeoutMs() {
  const configured = Number(process.env.ANALYTICS_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

function assertObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AnalysisServiceError(`${name} must be an object`, {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }
}

function normaliseRowsWithFieldMap(rows, mapping) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AnalysisServiceError('No sensor data is available for analysis', {
      status: 404,
      code: 'DATA_NOT_FOUND',
    });
  }

  return rows.map((row) => {
    const normalised = {};
    const timestamp = row.timestamp ?? row.created_at;

    if (timestamp !== undefined && timestamp !== null) {
      const parsedTimestamp = new Date(timestamp);
      if (Number.isNaN(parsedTimestamp.getTime())) {
        throw new AnalysisServiceError('Each sensor row must contain a valid timestamp', {
          status: 400,
          code: 'VALIDATION_ERROR',
        });
      }
      normalised.timestamp = parsedTimestamp.toISOString();
    }

    for (const [key, value] of Object.entries(row)) {
      if (['timestamp', 'created_at', 'entry_id', 'dataset_id'].includes(key)) continue;
      const fieldMapping = mapping[key];
      const canonicalName = typeof fieldMapping === 'object' ? fieldMapping.name : fieldMapping || key;

      // Do not allow un-mapped ThingSpeak field names across the service boundary.
      if (/^field\d+$/i.test(canonicalName)) continue;
      const numericValue = value === null || value === '' ? null : Number(value);
      if (numericValue !== null && !Number.isFinite(numericValue)) {
        throw new AnalysisServiceError(`Metric '${canonicalName}' must be numeric or null`, {
          status: 400,
          code: 'VALIDATION_ERROR',
        });
      }
      normalised[canonicalName] = numericValue === null || !fieldMapping?.transform
        ? numericValue
        : fieldMapping.transform(numericValue);
    }

    return normalised;
  });
}

function normaliseRows(rows, dataset) {
  return normaliseRowsWithFieldMap(rows, staticMappingForDataset(dataset));
}

function canonicalName(fieldMapping) {
  return typeof fieldMapping === 'object' ? fieldMapping.name : fieldMapping;
}

function normaliseSelectedMetrics(request, fieldMap) {
  const mappedMetric = (metric) => {
    const fieldMapping = fieldMap[metric];
    if (fieldMapping) return canonicalName(fieldMapping);
    if (Object.values(fieldMap).some((value) => canonicalName(value) === metric)) {
      return metric;
    }
    throw new AnalysisServiceError(
      `Selected stream '${metric}' is not mapped for this dataset`,
      { status: 400, code: 'ANALYTICS_METRIC_UNMAPPED' },
    );
  };

  return {
    ...request,
    ...(request.model?.metric
      ? { model: { ...request.model, metric: mappedMetric(request.model.metric) } }
      : {}),
    ...(Array.isArray(request.correlation?.streams)
      ? {
          correlation: {
            ...request.correlation,
            streams: request.correlation.streams.map(mappedMetric),
          },
        }
      : {}),
  };
}

async function normaliseDatasetRequest(request, rows, dataset) {
  // Direct data batches are already required by the API contract to use
  // logical metric names, and have no persisted dataset mapping to resolve.
  if (Array.isArray(request.data)) {
    return { request, rows: normaliseRows(rows, request.dataset) };
  }

  const mappings = dataset?.mappings || [];
  if (mappings.length) {
    const channelId =
      /^thingspeak-(\d+)$/.exec(dataset.name)?.[1] ||
      (dataset.name === 'thingspeak-live'
        ? process.env.THINGSPEAK_CHANNEL_ID
        : undefined);
    const fieldMap = fieldMapFromMappings(mappings, channelId);
    return {
      request: normaliseSelectedMetrics(request, fieldMap),
      rows: normaliseRowsWithFieldMap(rows, fieldMap),
    };
  }

  // Every remaining dataset-first request must have a persisted mapping;
  // passing raw fieldN names through to AIntl is forbidden.
  throw new AnalysisServiceError(
    'No field mapping is configured for this dataset',
    { status: 400, code: 'ANALYTICS_DATASET_MAPPING_NOT_FOUND' },
  );
}

async function buildAnalyticsPayload(request, rows, dataset) {
  assertObject(request, 'Request body');
  assertObject(request.model, 'model');
  assertObject(request.correlation, 'correlation');

  const normalised = await normaliseDatasetRequest(request, rows, dataset);
  request = normalised.request;
  rows = normalised.rows;

  const { model, correlation } = request;
  if (typeof model.metric !== 'string' || !model.metric.trim()) {
    throw new AnalysisServiceError('model.metric must be a non-empty canonical metric name', {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  if (!Array.isArray(correlation.streams) || correlation.streams.length < 2) {
    throw new AnalysisServiceError('correlation.streams must contain at least two canonical metric names', {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const data = rows;
  const columns = new Set(data.flatMap((row) => Object.keys(row)));
  const requestedMetrics = [model.metric, ...correlation.streams];
  const unknownMetric = requestedMetrics.find((metric) => !columns.has(metric));
  if (unknownMetric) {
    throw new AnalysisServiceError(`Canonical metric '${unknownMetric}' is not available in the selected data`, {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  return {
    entity_id: request.entity_id ?? dataset?.name ?? null,
    timestamp_col: 'timestamp',
    data,
    model: {
      detector: model.detector ?? 'isolationforest',
      metric: model.metric,
      parameters: model.parameters ?? {},
    },
    correlation: {
      streams: correlation.streams,
      window_size: correlation.window_size ?? 20,
      step_size: correlation.step_size ?? 10,
      method: correlation.method ?? 'pearson',
    },
  };
}

async function loadRows(request, userId) {
  if (Array.isArray(request.data)) return request.data;
  if (!Number.isInteger(request.datasetId) || request.datasetId < 1) {
    throw new AnalysisServiceError('datasetId must be a positive integer when data is not supplied', {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const rows = await timeseriesService.getWideEntriesForDatasetId(
    request.datasetId,
    userId,
  );
  if (!rows) {
    throw new AnalysisServiceError('Dataset not found or contains no sensor data', {
      status: 404,
      code: 'DATASET_NOT_FOUND',
    });
  }
  return rows;
}

async function callAnalytics(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), analyticsTimeoutMs());
  let response;

  try {
    response = await fetch(`${analyticsUrl()}/analytics/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AnalysisServiceError('Analytics service timed out', {
        status: 504,
        code: 'ANALYTICS_TIMEOUT',
      });
    }
    throw new AnalysisServiceError('Analytics service is unavailable', {
      status: 503,
      code: 'ANALYTICS_UNAVAILABLE',
    });
  } finally {
    clearTimeout(timeout);
  }

  let body;
  try {
    body = await response.json();
  } catch (_) {
    throw new AnalysisServiceError('Analytics service returned an invalid response', {
      status: 502,
      code: 'ANALYTICS_INVALID_RESPONSE',
    });
  }

  if (!response.ok) {
    const invalidRequest = response.status >= 400 && response.status < 500;
    throw new AnalysisServiceError(
      invalidRequest ? 'Analytics rejected the analysis request' : 'Analytics processing failed',
      {
        status: invalidRequest ? 400 : 502,
        code: invalidRequest ? 'ANALYTICS_INVALID_REQUEST' : 'ANALYTICS_UPSTREAM_ERROR',
        details: body.errors,
      },
    );
  }
  return body;
}

async function runAnalysis(request, userId) {
  assertObject(request, 'Request body');

  const rows = await loadRows(request, userId);

  const dataset = Array.isArray(request.data)
    ? null
    : await datasetRepository.findById(
        request.datasetId,
        userId,
        process.env.THINGSPEAK_DATASET_OWNER_ID,
      );

  if (!Array.isArray(request.data) && !dataset) {
    throw new AnalysisServiceError('Dataset not found or contains no sensor data', {
      status: 404,
      code: 'DATASET_NOT_FOUND',
    });
  }

  const payload = await buildAnalyticsPayload(request, rows, dataset);

  // Step 1: Request analytics results from the Python service.
  const analyticsResponse = await callAnalytics(payload);

  // Step 2: Only persist alerts from successful analytics responses.
  if (analyticsResponse.status !== 'success') {
    return analyticsResponse;
  }

  if (!Array.isArray(analyticsResponse.alerts)) {
    throw new AnalysisServiceError(
      'Analytics service returned an invalid alerts collection',
      {
        status: 502,
        code: 'ANALYTICS_INVALID_RESPONSE',
      },
    );
  }

  // Step 3: Save generated alerts permanently in PostgreSQL.
  const savedAlerts = await analyticsAlertRepository.createMany({
    alerts: analyticsResponse.alerts,
    userId,
    datasetId: Array.isArray(request.data) ? null : request.datasetId,
  });

  // Step 4: Return alerts with their permanent database IDs.
  return {
    ...analyticsResponse,
    alerts: savedAlerts,
  };
}

module.exports = {
  runAnalysis,
  buildAnalyticsPayload,
  normaliseRows,
  normaliseRowsWithFieldMap,
  AnalysisServiceError,
};
