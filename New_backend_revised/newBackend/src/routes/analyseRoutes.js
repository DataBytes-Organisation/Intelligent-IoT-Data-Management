const router = require('express').Router();
const { analyse } = require('../controllers/analyseController');

router.post('/analyse', analyse);

module.exports = router;
