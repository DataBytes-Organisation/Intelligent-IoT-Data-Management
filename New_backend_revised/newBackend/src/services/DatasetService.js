class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'BAD_REQUEST';
  }
}

class DatasetService {
  constructor(datasetRepository) {
    this.datasetRepository = datasetRepository;
  }

  async getAllDatasets() {
    try {
      const datasets = await this.datasetRepository.getAllDatasets();

      return {
        success: true,
        data: datasets.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || null,
          createdAt: r.created_at || null
        }))
      };
    } catch (error) {
      console.error('DatasetService.getAllDatasets error:', error);
      return { success: false, error: 'Failed to retrieve datasets' };
    }
  }

  async getDatasetMetadata(datasetName) {
    try {
      if (!datasetName || typeof datasetName !== 'string') {
        throw new ValidationError('Invalid dataset name provided');
      }

      const dataset = await this.datasetRepository.findDatasetByName(datasetName);
      if (!dataset) {
        throw new NotFoundError(`Dataset "${datasetName}" not found`);
      }

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
          timeBounds
        }
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('DatasetService.getDatasetMetadata error:', error);
      return { success: false, error: 'Failed to retrieve dataset metadata' };
    }
  }
}

module.exports = DatasetService;
