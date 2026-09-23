class SeriesController {
  constructor(seriesService) {
    this.seriesService = seriesService;

    this.getSeries = this.getSeries.bind(this);
  }

  async getSeries(req, res, next) {
    try {
      const filters = {
        datasetId: req.query.datasetId,
        stream: req.query.stream,
        interval: req.query.interval || 'raw',
        from: req.query.from,
        to: req.query.to,
        threshold: req.query.threshold ? parseFloat(req.query.threshold) : undefined
      };

      const result = await this.seriesService.getTimeSeries(filters);
      res.status(200).json(result.data);
    } catch (error) {
      if (error && error.code === 'BAD_REQUEST') {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = SeriesController;
