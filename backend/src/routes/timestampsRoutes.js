const express = require('express');
const router = express.Router();

const {
  getTimestampsForDatasetId,
} = require('../controllers/timestampsController');
const legacyDatasetIdentityMiddleware = require('../middleware/legacyDatasetIdentityMiddleware');

// TODO(FE auth migration): Replace the temporary shared ThingSpeak identity
// with authMiddleware after the frontend sends Bearer tokens for timestamp reads.
router.use(legacyDatasetIdentityMiddleware);

// GET /api/datasets/:datasetId/timestamps
router.get('/datasets/:datasetId/timestamps', getTimestampsForDatasetId);

module.exports = router;
