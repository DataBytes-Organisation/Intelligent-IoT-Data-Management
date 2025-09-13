//handles routing for mock data endpoints

const express = require('express');
const {
  getStreams,
  getStreamNames,
  postFilterStreams,
  getCorrelationAnalysis,
  getAnomalyDetection,
  getDataExport,
  getAvailableAlgorithms,
  getStatistics
} = require('../controllers/mockController');

const router = express.Router();

/*
 * GET /streams
 *
 * Description:
 * Returns the dataset in JSON format,
 * containing all entries including metadata (e.g., created_at, entry_id) and multiple stream values.
 *
 * Example Response:
 * [
 *   {
 *     "created_at": "2025-03-19T15:01:59.000Z",
 *     "entry_id": 3242057,
 *     "Temperature": 22,
 *     "Voltage Charge": 12.51,
 *     "Humidity": 45
 *   },
 *   ...
 * ]
 */
router.get('/streams', getStreams);

/*
 * GET /stream-names
 *
 * Description:
 * Returns an array of available stream names (in string format) extracted from the dataset
 *
 * Example Response:
 * [
 *   "Temperature",
 *   "Voltage Charge",
 *   "Humidity",
 *   "Current Draw"
 * ]
 */
router.get("/stream-names", getStreamNames);

/*
 * POST /filter-streams
 * Request Body:
 * {
 *   streamNames: [ "Temperature", "Voltage Charge" ]
 * }
 *
 * Description:
 * Returns the specified stream names and timestamp,
 * with the entries in original format.
 * 
 * Example Response:
 * [
 *    {
 *      "created_at": "2025-03-19T15:01:59.000Z",
 *      "entry_id": 3242057,
 *      "Temperature": 22,
 *      "Voltage Charge": 12.51
 *    },
 *    {
 *      "created_at": "2025-03-19T15:02:29.000Z",
 *      "entry_id": 3242058,
 *      "Temperature": 22,
 *      "Voltage Charge": 12.61
 *    }
 * ] 
 */
router.post('/filter-streams', postFilterStreams);

/*
 * POST /correlations
 * Request Body:
 * {
 *   "streams": ["Temperature", "Voltage Charge", "Humidity"],
 *   "start_date": "2025-03-19T15:00:00.000Z",
 *   "end_date": "2025-03-19T16:00:00.000Z",
 *   "algorithm_type": "correlation",
 *   "threshold": 0.5
 * }
 * 
 * Description:
 * Performs correlation analysis on selected streams
 */
router.post('/correlations', getCorrelationAnalysis);

/*
 * POST /anomalies
 * Request Body:
 * {
 *   "streams": ["Temperature", "Voltage Charge"],
 *   "start_date": "2025-03-19T15:00:00.000Z",
 *   "end_date": "2025-03-19T16:00:00.000Z",
 *   "algorithm_type": "isolation_forest",
 *   "contamination": 0.1
 * }
 * 
 * Description:
 * Performs anomaly detection using ML algorithms
 */
router.post('/anomalies', getAnomalyDetection);

/*
 * POST /export
 * Request Body:
 * {
 *   "streams": ["Temperature", "Voltage Charge"],
 *   "start_date": "2025-03-19T15:00:00.000Z",
 *   "end_date": "2025-03-19T16:00:00.000Z",
 *   "format": "json"
 * }
 * 
 * Description:
 * Exports data in various formats (JSON, CSV)
 */
router.post('/export', getDataExport);

/*
 * GET /algorithms
 * 
 * Description:
 * Returns available ML algorithms for correlation and anomaly detection
 */
router.get('/algorithms', getAvailableAlgorithms);

/*
 * GET /statistics
 * 
 * Description:
 * Returns statistical summary of the dataset
 */
router.get('/statistics', getStatistics);

module.exports = router;