class TimeseriesService {
  constructor(timeSeriesRepository, datasetRepository) {
    this.timeSeriesRepository = timeSeriesRepository;
    this.datasetRepository = datasetRepository;
  }

  async getTimeseries(datasetId, limit) {
    try {
      // Validate input
      if (!datasetId) {
        const error = new Error('datasetId is required');
        error.code = 'BAD_REQUEST';
        throw error;
      }

      // Validate and sanitize limit
      const sanitizedLimit = Math.min(Math.max(parseInt(limit || '1000', 10), 1), 10000);

      // Validate dataset exists
      const dataset = await this.datasetRepository.findDatasetByName(datasetId);
      if (!dataset) {
        const error = new Error('Dataset not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Get available timeseries for this dataset
      const timeseries = await this.timeSeriesRepository.getAvailableTimeseries(
        dataset.id, 
        sanitizedLimit
      );

      return {
        success: true,
        data: {
          datasetId,
          limit: sanitizedLimit,
          timeseries
        }
      };
    } catch (error) {
      if (error.code === 'BAD_REQUEST' || error.code === 'NOT_FOUND') {
        throw error;
      }
      console.error('TimeseriesService.getTimeseries error:', error);
      throw new Error('Failed to retrieve timeseries list');
    }
  }
}

module.exports = TimeseriesService;