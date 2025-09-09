const router = require('express').Router();
const { listDatasets, datasetMeta } = require('../controllers/datasetsController');

router.get('/datasets', listDatasets);        // GET /api/datasets
router.get('/datasets/:id/meta', datasetMeta); // GET /api/datasets/:id/meta

module.exports = router;
