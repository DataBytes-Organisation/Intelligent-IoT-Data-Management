/**
 * Reusable transformation contract between PostgreSQL wide-format rows
 * and downstream Correlation & Anomaly detection microservices.
 */

/**
 * Builds a request payload for the Correlation Alert service.
 * @param {number|string} datasetId 
 * @param {Array<Object>} dbRows - Raw timeseries rows from PostgreSQL
 * @param {Array<string>} selectedStreams - eg. ["field1", "field2"]
 * @param {Object} [options={}] - Custom window settings
 */
function buildCorrelationPayload(datasetId, dbRows, selectedStreams, options = {}) {
  if (!datasetId) {
    throw new Error('dataset_id is required for correlation request');
  }
  if (!selectedStreams || !Array.isArray(selectedStreams) || selectedStreams.length === 0) {
    throw new Error('selected_streams must be a non-empty array');
  }
  if (!dbRows || !Array.isArray(dbRows) || dbRows.length === 0) {
    return { status: 'NO_DATA', dataset_id: datasetId, data: [] };
  } 


  const timestampCol = options.timestamp_col || 'created_at';

  // Format DB rows ensuring required streams exist and numeric values are preserved
  const data = dbRows.map(row => {
    const record = { [timestampCol]: row[timestampCol] || row.created_at || row.ts };
    selectedStreams.forEach(stream => {
      const val = row[stream];
      record[stream] = (val !== null && val !== undefined && !isNaN(val)) ? Number(val) : null;
    });
    return record;
  });

  return {
    dataset_id: datasetId,
    timestamp_col: timestampCol,
    selected_streams: selectedStreams,
    window_size: options.window_size || 20,
    step_size: options.step_size || 10,
    method: options.method || 'pearson',
    data
  };
}

/**
 * Builds a request payload for Anomaly Detection models.
 * @param {number|string} datasetId 
 * @param {Array<Object>} dbRows 
 * @param {string} metric - Target stream column (eg. "field1")
 * @param {string} [modelName='PcaADDetector'] 
 */

//Extract data for a single sensor metric for anomaly detection models
function buildAnomalyPayload(datasetId, dbRows, metric, modelName = 'PcaADDetector') {
  if (!datasetId || !metric) {
    throw new Error('datasetId and metric are required for anomaly request');
  }
  if (!dbRows || !Array.isArray(dbRows) || dbRows.length === 0) {
    return { status: 'NO_DATA', dataset_id: datasetId, timestamps: [], values: [] };
  }

  const timestamps = [];
  const values = [];

  dbRows.forEach(row => {
    const ts = row.created_at || row.ts || row.timestamp;
    const val = row[metric];
    if (ts !== undefined) {
      timestamps.push(ts);
      values.push((val !== null && val !== undefined && !isNaN(val)) ? Number(val) : null);
    }
  });

  return {
    dataset_id: datasetId,
    metric,
    model_name: modelName,
    timestamps,
    values
  };
}

/**
 * Normalizes Python correlation response into database and frontend format.
 * @param {Object} rawResponse 
 * @param {number|string} datasetId 
 */

function parseCorrelationResponse(rawResponse, datasetId) {
  if (!rawResponse) {
    return { status: 'ERROR', code: 'EMPTY_RESPONSE', alerts: [], analytics_results: [] };
  }
  if (rawResponse.status === 'NO_DATA') {
    return { status: 'NO_DATA', alerts: [], analytics_results: [] };
  }

  const rawAlerts = rawResponse.alerts || [];
  const rawCorrelations = rawResponse.correlations || rawResponse.analytics_results || [];

  const alerts = rawAlerts.map(a => ({
    dataset_id: datasetId,
    entity: `${a.stream_1}_vs_${a.stream_2}`,
    rule_name: 'Correlation_Change',
    severity: a.alert_level || 'MEDIUM',
    previous_corr: a.previous_corr !== undefined ? a.previous_corr : null,
    current_corr: a.current_corr !== undefined ? a.current_corr : null,
    delta: a.delta !== undefined ? a.delta : null,
    reason: a.reason || 'Correlation change threshold breached',
    triggered_at: a.end_time || new Date().toISOString()
  }));

  const analyticsResults = rawCorrelations.map(c => ({
    dataset_id: datasetId,
    metric_type: `${c.method || 'pearson'}_correlation`,
    calculated_value: c.correlation !== undefined ? c.correlation : c.calculated_value,
    stream_1: c.stream_1,
    stream_2: c.stream_2,
    window_start: c.start_time || null,
    window_end: c.end_time || null
  }));

  return {
    status: 'success',
    summary: rawResponse.summary || { alerts_count: alerts.length, results_count: analyticsResults.length },
    alerts,
    analytics_results: analyticsResults
  };
}

/**
 * Normalizes Anomaly detector response.
 * @param {Object} rawResponse 
 * @param {number|string} datasetId 
 */
function parseAnomalyResponse(rawResponse, datasetId) {
  if (!rawResponse) {
    return { status: 'ERROR', code: 'EMPTY_RESPONSE', anomalies: [] };
  }

  const anomalies = (rawResponse.anomalies || []).map(item => ({
    dataset_id: datasetId,
    timestamp: item.timestamp,
    score: item.score !== undefined ? item.score : null,
    anomaly_flag: item.anomaly_flag || 0
  }));

  return {
    status: rawResponse.status || 'success',
    model_name: rawResponse.model_name || 'Unknown',
    runtime_ms: rawResponse.runtime_ms || 0,
    anomalies
  };
}

module.exports = {
  buildCorrelationPayload,
  buildAnomalyPayload,
  parseCorrelationResponse,
  parseAnomalyResponse
};