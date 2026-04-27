class DatasetController {
  constructor(datasetService) {
    this.datasetService = datasetService;
    
    // Bind methods to preserve 'this' context
    this.listDatasets = this.listDatasets.bind(this);
    this.datasetMeta = this.datasetMeta.bind(this);
  }

  async listDatasets(req, res) {
    try {
      const result = await this.datasetService.getAllDatasets();
      res.status(200).json(result);
    } catch (error) {
      console.error('DatasetController.listDatasets error:', error);
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to retrieve datasets'
      });
    }
  }

  async datasetMeta(req, res) {
    try {
      const datasetName = req.params.id;
      const result = await this.datasetService.getDatasetMetadata(datasetName);
      res.status(200).json(result.data);
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          code: 'not_found',
          message: 'dataset not found'
        });
      }
      
      console.error('DatasetController.datasetMeta error:', error);
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to retrieve dataset metadata'
      });
    }
  }
}

module.exports = DatasetController;