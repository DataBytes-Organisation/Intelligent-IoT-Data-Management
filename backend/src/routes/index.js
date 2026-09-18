const router = require('express').Router();

// Mock routes
router.use(require('./mock'));

// Analysis routes
router.use(require('./analyseRoutes'));      // POST /api/analyse

// Dataset metadata routes
router.use(require('./datasetRoutes'));     // GET/POST /api/datasets

// Time‑series routes
router.use(require('./seriesRoutes'));       // GET/POST /api/datasets/:datasetId/series

// Timestamp routes
router.use(require('./timestampsRoutes'));   // GET /api/datasets/:datasetId/timestamps

module.exports = router;
