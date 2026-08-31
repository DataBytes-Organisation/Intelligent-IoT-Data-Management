const express = require('express');
const router = express.Router();

const {
  analyse,
  correlationAlert
} = require('../controllers/analyseController');

// Existing generic analysis route
// POST /api/analyse
router.post('/analyse', analyse);

// Correlation route
// POST /api/correlation-alert
router.post('/correlation-alert', correlationAlert);

module.exports = router;