const express = require('express');
const router = express.Router();

const {
  getSeriesByDatasetName,
  filterSeriesByMetrics,
} = require('../controllers/seriesController');
const authMiddleware = require('../middleware/authMiddleware');

// TODO(FE dataset-ID migration): Restore authMiddleware and use a numeric
// `:datasetId` only after the frontend sends Bearer tokens and routes dashboards
// with `dataset.id`. Until then, preserve the existing name-based read route.
// GET /api/datasets/:name/series
router.get('/datasets/:name/series', getSeriesByDatasetName);

// POST /api/datasets/:datasetId/series/filter
router.post('/datasets/:datasetId/series/filter', authMiddleware, filterSeriesByMetrics);

module.exports = router;
