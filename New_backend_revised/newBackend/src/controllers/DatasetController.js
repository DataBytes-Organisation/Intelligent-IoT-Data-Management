class DatasetController {
  constructor(datasetService) {
    this.datasetService = datasetService;

    this.getAllDatasets = this.getAllDatasets.bind(this);
    this.getDatasetMeta = this.getDatasetMeta.bind(this);
    this.getDatasetMeta = this.getDatasetMeta.bind(this);
  }

  async getAllDatasets(req, res, next) {
    try {
      const result = await this.datasetService.getAllDatasets();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDatasetMeta(req, res, next) {
    try {
      const datasetId = req.params.id;
      const result = await this.datasetService.getDatasetMetadata(datasetId);
      res.status(200).json(result);
    } catch (error) {
      if (error && error.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Dataset not found' });
      }
      next(error);
    }
  }
}

module.exports = DatasetController;
