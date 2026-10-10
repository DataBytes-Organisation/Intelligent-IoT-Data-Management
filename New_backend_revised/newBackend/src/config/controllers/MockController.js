class MockController {
  constructor(mockService) {
    this.mockService = mockService;

    this.getStreams = this.getStreams.bind(this);
    this.getStreamNames = this.getStreamNames.bind(this);
    this.filterStreams = this.filterStreams.bind(this);
  }

  async getStreams(req, res, next) {
    try {
      const data = await this.mockService.getStreams();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getStreamNames(req, res, next) {
    try {
      const names = await this.mockService.getStreamNames();
      res.status(200).json({ success: true, data: names });
    } catch (error) {
      next(error);
    }
  }

  async filterStreams(req, res, next) {
    try {
      const { names } = req.body;
      if (!Array.isArray(names)) {
        return res.status(400).json({ success: false, message: 'names must be an array' });
      }
      const filtered = await this.mockService.filterStreams(names);
      res.status(200).json({ success: true, data: filtered });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MockController;
