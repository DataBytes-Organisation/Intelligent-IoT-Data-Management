class MockService {
  constructor(mockRepository) {
    this.mockRepository = mockRepository;
  }

  async getStreams() {
    return this.mockRepository.fetchStreams();
  }

  async getStreamNames() {
    const streams = await this.mockRepository.fetchStreams();
    return streams.map(s => s.name);
  }

  async filterStreams(names) {
    return this.mockRepository.fetchStreamsByNames(names);
  }
}

module.exports = MockService;
