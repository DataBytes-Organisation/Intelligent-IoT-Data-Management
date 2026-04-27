const express = require('express');
const pool = require('../db/pool');
const DIContainer = require('../container/DIContainer');

const router = express.Router();
const container = new DIContainer(pool);
const datasetController = container.resolve('datasetController');

// GET /api/datasets
router.get('/', datasetController.getAllDatasets.bind(datasetController));

// GET /api/datasets/:id/meta
router.get('/:id/meta', datasetController.getDatasetMeta.bind(datasetController));

module.exports = router;
