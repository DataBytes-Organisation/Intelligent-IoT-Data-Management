const router = require('express').Router();
const { getSeries } = require('../controllers/seriesController');

router.get('/series', getSeries); // GET /api/series?datasetId=&stream=&interval=&from=&to=

module.exports = router;
