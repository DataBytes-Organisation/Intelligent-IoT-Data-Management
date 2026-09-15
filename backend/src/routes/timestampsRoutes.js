const express = require('express');
const router = express.Router();

const {
  getTimestampsForDatasetId,
} = require('../controllers/timestampsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/datasets/:datasetId/timestamps
router.get('/datasets/:datasetId/timestamps', authMiddleware, getTimestampsForDatasetId);

module.exports = router;
