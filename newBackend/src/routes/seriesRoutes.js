// src/routes/seriesRoutes.js

const express = require('express');
const pool = require('../db/pool');
const DIContainer = require('../container/DIContainer');

const router = express.Router();

// Initialize container
const container = new DIContainer(pool);
const seriesController = container.resolve('seriesController');

// Routes
router.get('/', seriesController.getSeries); // GET /api/series

module.exports = router;
