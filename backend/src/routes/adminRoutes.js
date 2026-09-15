const express = require('express');
const router = express.Router();
const { handleDatasetCleanup } = require('../controllers/cleanupController');

// Maintenance endpoint for running dataset cleanup
router.post('/admin/cleanup/datasets', handleDatasetCleanup);

module.exports = router;