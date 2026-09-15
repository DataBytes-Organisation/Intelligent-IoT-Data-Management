const express = require('express');
const router = express.Router();

const {
  getTimestampsForDatasetName,
} = require('../controllers/timestampsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/datasets/:name/timestamps
router.get('/datasets/:name/timestamps', authMiddleware, getTimestampsForDatasetName);

module.exports = router;
