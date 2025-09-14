const router = require('express').Router();
const container = require('../container/DIContainer');

const seriesController = container.resolve('seriesController');

router.get('/series', seriesController.getSeries);

module.exports = router;
