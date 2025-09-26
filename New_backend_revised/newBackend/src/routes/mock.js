//handles routing for mock data endpoints

const express = require('express');
const {
  getStreams,
  getStreamNames,
  postFilterStreams
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

module.exports = router;