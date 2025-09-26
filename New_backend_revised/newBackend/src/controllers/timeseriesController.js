class TimeseriesController {
  constructor(timeseriesService) {
    this.timeseriesService = timeseriesService;

    // Bind methods
    this.listTimeseries = this.listTimeseries.bind(this);
  }

  async listTimeseries(req, res) {
    try {
      const { datasetId, limit } = req.query;
      if (!datasetId) {
        return res.status(400).json({
          code: 'bad_request',
          message: 'datasetId is required'
        });
      }

      const lim = Math.min(Math.max(parseInt(limit || '1000', 10), 1), 10000);

      const timeseries = await this.timeseriesService.getTimeseries(datasetId, lim);

      if (!timeseries) {
        return res.status(404).json({
          code: 'not_found',
          message: 'dataset not found'
        });
      }

      res.status(200).json({ timeseries });
    } catch (error) {
      console.error('TimeseriesController.listTimeseries error:', error);
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to retrieve timeseries'
      });
    }
  }
}

module.exports = TimeseriesController;

