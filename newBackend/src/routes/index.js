const router = require('express').Router();

//router.use(require('./health.routes'));   // GET  /api/health
router.use(require('./analyseRoutes'));  // POST /api/analyse

router.use(require('./datasetsRoutes'));
router.use(require('./seriesRoutes'));

module.exports = router;
