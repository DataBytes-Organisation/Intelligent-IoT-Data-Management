const router = require('express').Router();
const container = require('../container/DIContainer');

const datasetController = container.resolve('datasetController');

router.get('/datasets', datasetController.listDatasets);
router.get('/datasets/:id/meta', datasetController.datasetMeta);

module.exports = router;
