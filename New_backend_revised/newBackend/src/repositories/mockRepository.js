class MockRepository {
  constructor() {
    this.mockData = [
      { id: 1, name: 'temperature', ts: '2025-09-14T10:00:00Z', value: 22.5 },
      { id: 2, name: 'humidity', ts: '2025-09-14T10:00:00Z', value: 0.45 }
    ];
  }

  async fetchStreams() {
    return this.mockData;
  }

  async fetchStreamsByNames(names) {
    return this.mockData.filter(s => names.includes(s.name));
  }
}

module.exports = MockRepository;
