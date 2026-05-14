const express = require('express');
const router = express.Router();

const { analyse } = require('../controllers/analyseController');

// POST /api/analyse
router.post('/analyse', analyse);

module.exports = router;
