class SeriesService {
  constructor(timeSeriesRepository, datasetRepository) {
    this.timeSeriesRepository = timeSeriesRepository;
    this.datasetRepository = datasetRepository;
    this.VALID_INTERVALS = new Set(['raw', '5min', '15min', '1h', '6h']);
  }

  async getTimeSeries(filters) {
    try {
      // Validate input
      const validation = this.validateSeriesRequest(filters);
      if (!validation.valid) {
        const error = new Error(validation.message);
        error.code = 'BAD_REQUEST';
        throw error;
      }

      const { datasetId, stream, interval, from, to } = filters;

      // Validate dataset exists
      const dataset = await this.datasetRepository.findDatasetByName(datasetId);
      if (!dataset) {
        const error = new Error('Dataset not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      let series;
      if (interval === 'raw') {
        series = await this.timeSeriesRepository.getRawTimeSeries(
          dataset.id, stream, from, to
        );
        console.log(`✅ ${datasetId}/${stream} raw → ${series.length} rows`);
      } else {
        const bucketExpression = this.timeSeriesRepository.getBucketExpression(interval);
        series = await this.timeSeriesRepository.getAggregatedTimeSeries(
          dataset.id, stream, from, to, bucketExpression
        );
        console.log(`✅ ${datasetId}/${stream} ${interval} → ${series.length} rows`);
      }

      return {
        success: true,
        data: {
          datasetId,
          stream,
          interval,
          from,
          to,
          series
        }
      };
    } catch (error) {
      if (error.code === 'BAD_REQUEST' || error.code === 'NOT_FOUND') {
        throw error;
      }
      console.error('SeriesService.getTimeSeries error:', error);
      throw new Error('Failed to retrieve time series data');
    }
  }

  validateSeriesRequest(filters) {
    const { datasetId, stream, interval = 'raw', from, to } = filters;

    if (!datasetId || !stream || !from || !to) {
      return {
        valid: false,
        message: 'datasetId, stream, from, to required'
      };
    }

    if (!this.VALID_INTERVALS.has(interval)) {
      return {
        valid: false,
        message: 'use raw, 5min, 15min, 1h, 6h'
      };
    }

    return { valid: true };
  }
}

module.exports = SeriesService;