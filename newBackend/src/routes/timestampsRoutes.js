const router = require('express').Router();
const { listTimestamps } = require('../controllers/timestampsController');

router.get('/timestamps', listTimestamps);

module.exports = router;
