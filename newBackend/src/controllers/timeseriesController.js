class TimeseriesController {
  constructor(timeseriesService) {
    this.timeseriesService = timeseriesService;

    // Bind methods
    this.listTimeseries = this.listTimeseries.bind(this);
  }

  async listTimeseries(req, res) {
    try {
      const { datasetId, limit } = req.query;
      
      const result = await this.timeseriesService.getTimeseries(datasetId, limit);
      res.status(200).json(result.data);
    } catch (error) {
      if (error.code === 'BAD_REQUEST') {
        return res.status(400).json({
          code: 'bad_request',
          message: error.message
        });
      }

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          code: 'not_found',
          message: 'dataset not found'
        });
      }

      console.error('TimeseriesController.listTimeseries error:', error);
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to retrieve timeseries'
      });
    }
  }
}

module.exports = TimeseriesController;