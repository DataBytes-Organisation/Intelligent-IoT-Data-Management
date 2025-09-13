//handles data access for mock data, reading from local JSON file without a database yet

// Try to load .env file, but don't fail if it doesn't exist
try {
  require('dotenv').config({ path: '../.env' });
} catch (error) {
  console.log('No .env file found, using default configuration');
}

const fs = require('fs');
const path = require('path');

class MockRepository {
  constructor() {
    // Use environment variable if available, otherwise use default path
    const dataPath = process.env.PROCESSED_DATA_PATH || path.join(__dirname, 'mock_data', 'processed_data.json');
    this.filePath = path.resolve(dataPath);
    console.log('Data file path:', this.filePath);
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