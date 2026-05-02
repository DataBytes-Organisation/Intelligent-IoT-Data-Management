//handles data access for mock data, reading from local JSON file without a database yet

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class MockRepository {
  constructor() {
    const configuredPath = process.env.PROCESSED_DATA_PATH;
    if (!configuredPath) {
      throw new Error('PROCESSED_DATA_PATH is not configured');
    }

    this.filePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(__dirname, '..', configuredPath);
  }

  getMockData() {
    try {
      const rawData = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(rawData);
    } catch (err) {
      console.error('Error reading mock data:', err);
      throw new Error('Failed to read mock data');
    }
  }
}

module.exports = MockRepository;
