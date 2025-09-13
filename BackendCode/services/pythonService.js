// handles communication with Python Flask services for data science operations

const { spawn } = require('child_process');
const path = require('path');

// Base URL for Python Flask services
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

// Helper function to make HTTP requests to Python services
const makePythonRequest = async (endpoint, data) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling Python service ${endpoint}:`, error);
    throw error;
  }
};

// Analyze data using correlation algorithms
const analyze = async (data) => {
  const { streams, start_date, end_date, threshold, algo_type } = data;
  
  return await makePythonRequest('/analyze', {
    streams,
    start_date,
    end_date,
    threshold,
    algo_type
  });
};

// Generate visualization
const visualize = async (data) => {
  const { streams, start_date, end_date, type } = data;
  
  return await makePythonRequest('/visualize', {
    streams,
    start_date,
    end_date,
    type
  });
};

// Analyze CSV file
const analyzeCsv = async (data) => {
  const { window_size } = data;
  
  return await makePythonRequest('/analyze-csv', {
    window_size
  });
};

// Correlation analysis
const analyzeCorr = async (data) => {
  const { streams, start_date, end_date, threshold } = data;
  
  return await makePythonRequest('/analyze-corr', {
    streams,
    start_date,
    end_date,
    threshold
  });
};

module.exports = {
  analyze,
  visualize,
  analyzeCsv,
  analyzeCorr
};