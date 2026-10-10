class SeriesService {
  constructor(seriesRepository) {
    this.seriesRepository = seriesRepository;
  }

  async getTimeSeries(filters) {
    const { datasetId, stream, interval, from, to } = filters;

    if (!datasetId || !stream || !from || !to) {
      const err = new Error('datasetId, stream, from, to required');
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const allowed = new Set(['raw','5min','15min','1h','6h']);
    if (!allowed.has(interval)) {
      const err = new Error('Invalid interval');
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const dataset = await this.seriesRepository.findDataset(datasetId);
    if (!dataset) {
      const notFound = new Error('Dataset not found');
      notFound.code = 'NOT_FOUND';
      throw notFound;
    }

    let rows;
    if (interval === 'raw') {
      rows = await this.seriesRepository.fetchRawSeries(dataset.id, stream, from, to);
    } else {
      rows = await this.seriesRepository.fetchBucketedSeries(dataset.id, stream, from, to, interval);
    }

    return { data: { datasetId, stream, interval, from, to, series: rows } };
  }
}

module.exports = SeriesService;
