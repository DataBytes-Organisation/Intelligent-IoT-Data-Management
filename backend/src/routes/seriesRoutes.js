const express = require('express');
const router = express.Router();

const {
  getSeriesByDatasetName,
  filterSeriesByMetrics,
} = require('../controllers/seriesController');

// GET /api/datasets/:name/series
router.get('/datasets/:name/series', getSeriesByDatasetName);

// POST /api/datasets/:name/series/filter
router.post('/datasets/:name/series/filter', filterSeriesByMetrics);

module.exports = router;
