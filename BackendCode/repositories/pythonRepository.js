// handles data access for Python-based data science operations

const fs = require('fs');
const path = require('path');

class PythonRepository {
  constructor() {
    this.dataPath = path.resolve(__dirname, '../mock_data');
  }

  // Get available CSV files
  getAvailableDatasets() {
    try {
      const files = fs.readdirSync(this.dataPath);
      return files.filter(file => file.endsWith('.csv'));
    } catch (err) {
      console.error('Error reading datasets:', err);
      return [];
    }
  }

  // Get dataset by name
  getDataset(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Dataset ${filename} not found`);
      }
      return filePath;
    } catch (err) {
      console.error('Error getting dataset:', err);
      throw err;
    }
  }

  // Save processed data
  saveProcessedData(data, filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return filePath;
    } catch (err) {
      console.error('Error saving processed data:', err);
      throw err;
    }
  }
}

module.exports = PythonRepository;