//handles routing for mock data endpoints

const express = require('express');
const {
  getStreams,
  getStreamNames,
  postFilterStreams
} = require('../controllers/mockController');

const {
  postAnalyze,
  postVisualize,
  postAnalyzeCsv,
  postAnalyzeCorr
} = require('../controllers/pythonController');

const router = express.Router();
const { z } = require('zod');
const { validateRequest } = require('../middleware/validateRequest');
const {
  getStreamsSchema,
  getStreamNamesSchema,
  filterStreamsBody,
  analyzeBody,
  analyzeCsvBody,
  analyzeCorrBody
} = require('../validation/schemas');

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
router.get('/streams', validateRequest(getStreamsSchema), getStreams);

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
router.get('/stream-names', validateRequest(getStreamNamesSchema), getStreamNames);

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
router.post('/filter-streams', validateRequest({ body: filterStreamsBody }), postFilterStreams);

/*
 * POST /analyze
 * 
 * Description:
 * Sends a prototype CSV file and analysis parameters to the Python-based Flask service.
 * Returns the result of the correlation algorithm, including average correlation values and outlier flags.
 * 
 * Request Body (JSON):
 * {
 *   "streams": ["s1", "s2", "s3"],
 *   "start_date": "2025-01-01T00:00:00",
 *   "end_date": "2025-01-06T00:10:00",
 *   "threshold": 0.5,
 *   "algo_type": "correlation"
 * }
 * 
 * Example Response:
 * {
 *   "result": {
 *     "s1": { "avg_corr": 0.58, "is_outlier": false },
 *     "s2": { "avg_corr": 0.15, "is_outlier": true },
 *     "s3": { "avg_corr": 0.51, "is_outlier": false }
 *   }
 * }
 */
router.post('/analyze', validateRequest({ body: analyzeBody }), postAnalyze);

/*
 * POST /analyze-csv
 * 
 * Description:
 * Sends a prototype CSV file and optional window size to the Python-based Flask service.
 * Returns a cleaned and interpolated CSV file, suitable for downstream analysis or visualization.
 * 
 * Request Body (JSON):
 * {
 *   "window_size": 15
 * }
 * 
 * Example Response:
 * A downloadable CSV file containing:
 * - Renamed columns (e.g., first column as "data_point")
 * - Interpolated numeric values
 * - Generated timestamps
 * - Cleaned structure with no empty rows or columns
 */
router.post('/analyze-csv', validateRequest({ body: analyzeCsvBody }), postAnalyzeCsv);

/*
 * POST /analyze-corr
 * 
 * Description:
 * Sends selected stream IDs and a time range to the Flask service to compute pairwise correlations.
 * Returns a matrix of correlation coefficients and highlights any stream pairs below the threshold.
 * 
 * Request Body (JSON):
 * {
 *   "streams": ["s1", "s2", "s3"],
 *   "start_date": "2025-01-01T00:00:00",
 *   "end_date": "2025-01-06T00:10:00",
 *   "threshold": 0.5
 * }
 * 
 * Example Response:
 * {
 *   "correlation_matrix": {
 *     "s1": { "s2": 0.42, "s3": 0.61 },
 *     "s2": { "s1": 0.42, "s3": 0.33 },
 *     "s3": { "s1": 0.61, "s2": 0.33 }
 *   },
 *   "low_correlation_pairs": [
 *     ["s2", "s3"]
 *   ]
 * }
 */
router.post('/analyze-corr', validateRequest({ body: analyzeCorrBody }), postAnalyzeCorr); //not working yet, need to test

/*
 * POST /visualize
 * 
 * Description:
 * Sends a prototype CSV file and visualisation parameters to the Python-based Flask service.
 * Returns a base64-encoded PNG image of the selected visualisation type (e.g., grouped bar chart, scatter plot).
 * 
 * Request Body (JSON):
 * {
 *   "streams": ["field1", "field2", "field3"],
 *   "start_date": "2025-03-18T06:55:31",
 *   "end_date": "2025-03-18T07:00:43",
 *   "type": "grouped_bar_chart"
 * }
 * 
 * Example Response:
 * {
 *   "image": "iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAYAAAD..." // base64 string
 * }
 */
router.post('/visualize', postVisualize);

module.exports = router;