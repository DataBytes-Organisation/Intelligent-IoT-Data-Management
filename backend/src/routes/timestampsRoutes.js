const express = require('express');
const router = express.Router();

const {
  getTimestampsForDatasetName,
} = require('../controllers/timestampsController');

// GET /api/datasets/:name/timestamps
router.get('/datasets/:name/timestamps', getTimestampsForDatasetName);

module.exports = router;
