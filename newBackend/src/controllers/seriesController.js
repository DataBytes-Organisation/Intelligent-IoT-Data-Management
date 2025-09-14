class SeriesController {
  constructor(seriesService) {
    this.seriesService = seriesService;
    
    // Bind methods to preserve 'this' context
    this.getSeries = this.getSeries.bind(this);
  }

  async getSeries(req, res) {
    try {
      // Log request for debugging
      console.log('📥 GET /api/series query:', req.query);

      const filters = {
        datasetId: req.query.datasetId,
        stream: req.query.stream,
        interval: req.query.interval || 'raw',
        from: req.query.from,
        to: req.query.to
      };

      const result = await this.seriesService.getTimeSeries(filters);
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

      console.error('SeriesController.getSeries error:', error);
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to retrieve time series data'
      });
    }
  }
}

module.exports = SeriesController;