/**
 * Express router definitions for Alert endpoints
 */
const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// GET /api/alerts/latest
router.get('/latest', alertController.getLatestAlerts);

// GET /api/alerts/history
router.get('/history', alertController.getAlertHistory);

module.exports = router;