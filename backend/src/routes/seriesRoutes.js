const express = require('express');
const router = express.Router();

const {
  getSeriesByDatasetName,
  filterSeriesByMetrics,
} = require('../controllers/seriesController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/datasets/:name/series
router.get('/datasets/:name/series', authMiddleware, getSeriesByDatasetName);

// POST /api/datasets/:name/series/filter
router.post('/datasets/:name/series/filter', authMiddleware, filterSeriesByMetrics);

module.exports = router;
