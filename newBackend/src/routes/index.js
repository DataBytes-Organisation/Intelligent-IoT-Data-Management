const router = require('express').Router();

//router.use(require('./health.routes'));   // GET  /api/health
router.use(require('./analyseRoutes'));  // POST /api/analyse

module.exports = router;
