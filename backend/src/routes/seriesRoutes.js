const express = require('express');
const router = express.Router();

const {
  getSeriesByDatasetName,
  filterSeriesByMetrics,
} = require('../controllers/seriesController');
const legacyDatasetIdentityMiddleware = require('../middleware/legacyDatasetIdentityMiddleware');

// TODO(FE auth and dataset-ID migration): Replace this temporary shared
// ThingSpeak identity with authMiddleware and use a numeric `:datasetId` only
// after the frontend sends Bearer tokens and routes dashboards with `dataset.id`.
router.use(legacyDatasetIdentityMiddleware);

// GET /api/datasets/:name/series
router.get('/datasets/:name/series', getSeriesByDatasetName);

// POST /api/datasets/:datasetId/series/filter
router.post('/datasets/:datasetId/series/filter', filterSeriesByMetrics);

module.exports = router;
