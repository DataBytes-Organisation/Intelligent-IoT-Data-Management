const express = require('express');
const { fetchThingSpeakData } = require('../controllers/thingspeakController');

const router = express.Router();

router.get('/thingspeak/feeds', fetchThingSpeakData);

module.exports = router;