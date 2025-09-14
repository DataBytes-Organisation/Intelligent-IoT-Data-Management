/**
 * mockModule.js
 * Combines Controller, Service, and Repository for mock data into one file.
 * Optimized for readability and maintainability.
 */

const fs = require('fs');
const path = require('path');

/* ===============================
   Repository Layer
   =============================== */
class MockRepository {
  constructor(dataPath = '../data/processedData.json') {
    this.dataPath = path.resolve(__dirname, dataPath);
  }

  readProcessedData() {
    const raw = fs.readFileSync(this.dataPath, 'utf-8');
    return JSON.parse(raw);
  }

  getAvailableStreamNames() {
    const data = this.readProcessedData();
    return [...new Set(data.map(d => d.streamName))];
  }

  filterEntriesByStreamNames(names) {
    const data = this.readProcessedData();
    return data.filter(d => names.includes(d.streamName));
  }
}

/* ===============================
   Service Layer
   =============================== */
class MockService {
  constructor(mockRepository) {
    this.mockRepository = mockRepository;
  }

  async fetchStreams() {
    return this.mockRepository.readProcessedData();
  }

  async fetchStreamNames() {
    return this.mockRepository.getAvailableStreamNames();
  }

  async filterByStreams(names) {
    return this.mockRepository.filterEntriesByStreamNames(names);
  }
}

/* ===============================
   Controller Layer
   =============================== */
class MockController {
  constructor(mockService) {
    this.mockService = mockService;

    this.getStreams = this.getStreams.bind(this);
    this.getStreamNames = this.getStreamNames.bind(this);
    this.postFilterStreams = this.postFilterStreams.bind(this);
  }

  async getStreams(req, res) {
    try {
      const data = await this.mockService.fetchStreams();
      res.status(200).json(data);
    } catch (err) {
      console.error('MockController.getStreams error:', err);
      res.status(500).json({ error: 'Failed to load stream data' });
    }
  }

  async getStreamNames(req, res) {
    try {
      const names = await this.mockService.fetchStreamNames();
      if (!names.length) {
        return res.status(404).json({ error: 'No stream names found' });
      }
      res.json(names);
    } catch (err) {
      console.error('MockController.getStreamNames error:', err);
      res.status(500).json({ error: 'Failed to get stream names' });
    }
  }

  async postFilterStreams(req, res) {
    const { streamNames } = req.body;
    if (!Array.isArray(streamNames) || streamNames.length === 0) {
      return res.status(400).json({ error: 'streamNames must be a non-empty array' });
    }

    try {
      const filtered = await this.mockService.filterByStreams(streamNames);
      res.json(filtered);
    } catch (err) {
      console.error('MockController.postFilterStreams error:', err);
      res.status(500).json({ error: 'Failed to filter stream data' });
    }
  }
}

/* ===============================
   Export Factory
   =============================== */
function createMockModule() {
  const repo = new MockRepository();
  const service = new MockService(repo);
  const controller = new MockController(service);
  return controller;
}

module.exports = createMockModule;
