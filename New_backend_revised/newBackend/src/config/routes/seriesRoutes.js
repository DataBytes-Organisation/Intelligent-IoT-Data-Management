const express = require('express');
const pool = require('../db/pool');
const DIContainer = require('../container/DIContainer');

const router = express.Router();
const container = new DIContainer(pool);
const seriesController = container.resolve('seriesController');

// GET /api/series
router.get('/', seriesController.getSeries.bind(seriesController));

module.exports = router;
