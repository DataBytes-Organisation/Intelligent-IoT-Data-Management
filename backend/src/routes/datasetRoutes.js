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
const authMiddleware = require('../middleware/authMiddleware');

// TODO(FE auth migration): Reapply authMiddleware to these read routes after
// the frontend sends Bearer tokens for dataset reads. It must keep `dataset.id`
// (not `dataset.name`) as the dashboard route value at the same time.
// GET /api/datasets
router.get(
  '/datasets',
  (req, res, next) => {
    if (req.query.status === 'deleted') {
      return authMiddleware(req, res, next);
    }

    return next();
  },
  getAllDatasets,
);

// GET /api/datasets/:id
router.get('/datasets/:id', getDatasetById);

// POST /api/datasets
router.post('/datasets', authMiddleware, createDataset);

// PUT /api/datasets/:id
router.put('/datasets/:id', authMiddleware, updateDataset);

// DELETE /api/datasets/:id
router.delete('/datasets/:id', authMiddleware, deleteDataset);

router.post('/datasets/:id/restore', authMiddleware, restoreDataset);

module.exports = router;
