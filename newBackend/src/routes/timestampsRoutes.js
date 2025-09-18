const router = require('express').Router();
const container = require('../container/DIContainer');

const timeseriesController = container.resolve('timeseriesController');

router.get('/timeseries', timeseriesController.listTimeSeries);

module.exports = router;
