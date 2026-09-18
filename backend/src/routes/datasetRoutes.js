const express = require('express');
const router = express.Router();

const {
  getAllDatasets,
  getDatasetById,
  createDataset,
  updateDataset,
  deleteDataset,
  restoreDataset,
} = require('../controllers/datasetsController');
const legacyDatasetIdentityMiddleware = require('../middleware/legacyDatasetIdentityMiddleware');

// TODO(FE auth migration): Replace this temporary shared ThingSpeak identity
// with authMiddleware after the frontend sends Bearer tokens and keeps
// `dataset.id` (not `dataset.name`) as the dashboard route value.
router.use(legacyDatasetIdentityMiddleware);

// GET /api/datasets
router.get('/datasets', getAllDatasets);

// GET /api/datasets/:id
router.get('/datasets/:id', getDatasetById);

// POST /api/datasets
router.post('/datasets', createDataset);

// PUT /api/datasets/:id
router.put('/datasets/:id', updateDataset);

// DELETE /api/datasets/:id
router.delete('/datasets/:id', deleteDataset);

router.post('/datasets/:id/restore', restoreDataset);

module.exports = router;
