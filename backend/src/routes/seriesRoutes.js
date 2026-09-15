const express = require('express');
const router = express.Router();

const {
  getSeriesByDatasetId,
  filterSeriesByMetrics,
} = require('../controllers/seriesController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/datasets/:datasetId/series
router.get('/datasets/:datasetId/series', authMiddleware, getSeriesByDatasetId);

// POST /api/datasets/:datasetId/series/filter
router.post('/datasets/:datasetId/series/filter', authMiddleware, filterSeriesByMetrics);

module.exports = router;
