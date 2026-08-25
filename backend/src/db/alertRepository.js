/**
 * Repository layer for persisting and retrieving Alerts & Analytics Results
 */
const pool = require('./pool'); 

/**
 * Save mapped correlation alerts into PostgreSQL
 */
async function saveAlerts(alerts) {
  if (!alerts || alerts.length === 0) return [];
  
  const savedAlerts = [];
  for (const alert of alerts) {
    const query = `
      INSERT INTO alerts (dataset_id, entity, rule_name, severity, previous_corr, current_corr, delta, reason, triggered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      alert.dataset_id,
      alert.entity || 'system',
      alert.rule_name || 'Correlation_Change',
      alert.severity || 'MEDIUM',
      alert.previous_corr ?? null,
      alert.current_corr ?? null,
      alert.delta ?? null,
      alert.reason || '',
      alert.triggered_at || new Date().toISOString()
    ];
    
    const res = await pool.query(query, values);
    savedAlerts.push(res.rows[0]);
  }
  return savedAlerts;
}

/**
 * Save analytics computational metrics into PostgreSQL
 */
async function saveAnalyticsResults(results) {
  if (!results || results.length === 0) return [];

  const savedResults = [];
  for (const item of results) {
    const query = `
      INSERT INTO analytics_results (dataset_id, metric_type, calculated_value, window_start, window_end, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      item.dataset_id,
      item.metric_type,
      item.calculated_value,
      item.window_start || null,
      item.window_end || null,
      JSON.stringify(item.metadata || {})
    ];

    const res = await pool.query(query, values);
    savedResults.push(res.rows[0]);
  }
  return savedResults;
}

/**
 * Get latest active alerts across all or specific dataset
 */
async function getLatestAlerts(datasetId = null, limit = 10) {
  let query = `SELECT * FROM alerts`;
  const params = [];

  if (datasetId) {
    query += ` WHERE dataset_id = $1`;
    params.push(datasetId);
    query += ` ORDER BY triggered_at DESC LIMIT $2`;
    params.push(limit);
  } else {
    query += ` ORDER BY triggered_at DESC LIMIT $1`;
    params.push(limit);
  }

  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Get full historical alerts with filtering/pagination
 */
async function getAlertHistory(datasetId = null, severity = null, limit = 50, offset = 0) {
  let query = `SELECT * FROM alerts WHERE 1=1`;
  const params = [];

  if (datasetId) {
    params.push(datasetId);
    query += ` AND dataset_id = $${params.length}`;
  }

  if (severity) {
    params.push(severity);
    query += ` AND severity = $${params.length}`;
  }

  params.push(limit);
  query += ` ORDER BY triggered_at DESC LIMIT $${params.length}`;

  params.push(offset);
  query += ` OFFSET $${params.length}`;

  const res = await pool.query(query, params);
  return res.rows;
}

module.exports = {
  saveAlerts,
  saveAnalyticsResults,
  getLatestAlerts,
  getAlertHistory
};