//handles data access for mock data, reading from local JSON file without a database yet

require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');

class MockRepository {
  constructor() {
    // Use the processed_data.json from mock_data folder
    this.filePath = path.resolve(__dirname, '../mock_data/processed_data.json');
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