/**
 * Controller for Alert & Analytics Output Endpoints 
 */
const alertRepo = require('../db/alertRepository');

/**
 * GET /api/alerts/latest
 * Returns latest triggered alerts for live dashboard view
 */
async function getLatestAlerts(req, res) {
  try {
    const datasetId = req.query.dataset_id ? parseInt(req.query.dataset_id, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    const alerts = await alertRepo.getLatestAlerts(datasetId, limit);
    return res.json({
      status: 'success',
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * GET /api/alerts/history
 * Returns historical alerts with optional dataset, severity, and pagination filters
 */
async function getAlertHistory(req, res) {
  try {
    const datasetId = req.query.dataset_id ? parseInt(req.query.dataset_id, 10) : null;
    const severity = req.query.severity ? req.query.severity.toUpperCase() : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

    const history = await alertRepo.getAlertHistory(datasetId, severity, limit, offset);
    return res.json({
      status: 'success',
      count: history.length,
      filters: { datasetId, severity, limit, offset },
      data: history
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

module.exports = {
  getLatestAlerts,
  getAlertHistory
};