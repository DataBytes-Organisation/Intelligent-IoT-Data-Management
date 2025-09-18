// src/routes/datasetsRoutes.js

const express = require('express');
const pool = require('../db/pool'); // ensure you have your db pool exported
const DIContainer = require('../container/DIContainer');

const router = express.Router();

// Initialize container
const container = new DIContainer(pool);
const datasetController = container.resolve('datasetController');

// Routes
router.get('/', datasetController.getAllDatasets);       // GET /api/datasets
router.get('/:id/meta', datasetController.getDatasetMeta); // GET /api/datasets/:id/meta

module.exports = router;
