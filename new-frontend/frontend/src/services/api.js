// API service for backend communication
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  // Get all sensor data streams
  async getStreams() {
    try {
      const response = await fetch(`${API_BASE_URL}/streams`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching streams:', error);
      throw error;
    }
  }

  // Get available stream names
  async getStreamNames() {
    try {
      const response = await fetch(`${API_BASE_URL}/stream-names`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching stream names:', error);
      throw error;
    }
  }

  // Filter streams by selected stream names
  async filterStreams(streamNames) {
    try {
      const response = await fetch(`${API_BASE_URL}/filter-streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamNames }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error filtering streams:', error);
      throw error;
    }
  }

  // Analyze data using correlation algorithms
  async analyzeData(streams, startDate, endDate, threshold = null, algoType = 'correlation') {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streams,
          start_date: startDate,
          end_date: endDate,
          threshold,
          algo_type: algoType,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error analyzing data:', error);
      throw error;
    }
  }

  // Get correlation analysis
  async getCorrelationAnalysis(streams, startDate, endDate, threshold = 0.5) {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-corr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streams,
          start_date: startDate,
          end_date: endDate,
          threshold,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting correlation analysis:', error);
      throw error;
    }
  }

  // Generate visualization
  async generateVisualization(streams, startDate, endDate, type = 'grouped_bar_chart') {
    try {
      const response = await fetch(`${API_BASE_URL}/visualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streams,
          start_date: startDate,
          end_date: endDate,
          type,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error generating visualization:', error);
      throw error;
    }
  }
}

export default new ApiService();
