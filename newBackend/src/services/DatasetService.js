class DatasetService {
  constructor(datasetRepository) {
    this.datasetRepository = datasetRepository;
  }

  async getAllDatasets() {
    try {
      const datasets = await this.datasetRepository.getAllDatasets();
      return {
        success: true,
        items: datasets.map(r => ({
          id: r.name,
          name: r.name
        }))
      };
    } catch (error) {
      console.error('DatasetService.getAllDatasets error:', error);
      throw new Error('Failed to retrieve datasets');
    }
  }

  async getDatasetMetadata(datasetName) {
    try {
      // Validate dataset name
      if (!datasetName || typeof datasetName !== 'string') {
        throw new Error('Invalid dataset name provided');
      }

      // Find dataset
      const dataset = await this.datasetRepository.findDatasetByName(datasetName);
      if (!dataset) {
        const error = new Error('Dataset not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Get metadata
      const [fields, timeBounds] = await Promise.all([
        this.datasetRepository.getDatasetFields(dataset.id),
        this.datasetRepository.getDatasetTimeBounds(dataset.id)
      ]);

      return {
        success: true,
        data: {
          datasetId: datasetName,
          fieldCount: fields.length,
          fields: fields.map(r => r.metric),
          timeBounds: timeBounds
        }
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw error;
      }
      console.error('DatasetService.getDatasetMetadata error:', error);
      throw new Error('Failed to retrieve dataset metadata');
    }
  }
}

module.exports = DatasetService;