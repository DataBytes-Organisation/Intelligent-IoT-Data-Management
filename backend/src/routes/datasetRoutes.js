const express = require('express');
const router = express.Router();

const {
  getAllDatasets,
  getDatasetById,
  createDataset,
  updateDataset,
} = require('../controllers/datasetsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/datasets
router.get('/datasets', authMiddleware, getAllDatasets);

// GET /api/datasets/:id
router.get('/datasets/:id', authMiddleware, getDatasetById);

// POST /api/datasets
router.post('/datasets', authMiddleware, createDataset);

// PUT /api/datasets/:id
router.put('/datasets/:id', authMiddleware, updateDataset);

module.exports = router;
