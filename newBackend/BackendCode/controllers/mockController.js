//handles HTTP request logic for mock data routes

const {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames,
  performCorrelationAnalysis,
  performAnomalyDetection,
  exportData,
  getAvailableAlgorithms,
  getStatistics
} = require('../services/mockService');

//GET /streams — Returns JSON file containing the stream data
const getStreams = (req, res) => {
  try {
    const data = readProcessedData();
    res.json(data);
  } catch (err) {
    console.error('Error reading stream data:', err);
    res.status(500).json({ error: 'Failed to load stream data' });
  }
};

//Get /stream-names — Returns an array of available stream names
const getStreamNames = (req, res) => {
  try {
    const streamNames = getAvailableStreamNames();
    if (streamNames.length === 0) {
      return res.status(404).json({ error: "No stream names found" });
    }
    res.json(streamNames);
  } catch (err) {
    console.error('Error getting stream names:', err);
    res.status(500).json({ error: 'Failed to get stream names' });
  }
};

//POST /filter-streams — Returns JSON file by Filtering entries by stream names (without time window)
const postFilterStreams = (req, res) => {
  const { streamNames } = req.body;

  if (!Array.isArray(streamNames) || streamNames.length === 0) {
    return res.status(400).json({ error: 'streamNames must be a non-empty array' });
  }

  try {
    const filtered = filterEntriesByStreamNames(streamNames);
    res.json(filtered);
  } catch (err) {
    console.error('Error filtering stream data:', err);
    res.status(500).json({ error: 'Failed to filter stream data' });
  }
};

// POST /correlations — Performs correlation analysis
const getCorrelationAnalysis = (req, res) => {
  try {
    const { streams, start_date, end_date, algorithm_type = 'correlation', threshold } = req.body;
    
    if (!streams || !Array.isArray(streams) || streams.length < 3) {
      return res.status(400).json({ error: 'At least 3 streams are required for correlation analysis' });
    }
    
    const result = performCorrelationAnalysis(streams, start_date, end_date, algorithm_type, threshold);
    res.json({ result });
  } catch (err) {
    console.error('Error performing correlation analysis:', err);
    res.status(500).json({ error: 'Failed to perform correlation analysis' });
  }
};

// POST /anomalies — Performs anomaly detection
const getAnomalyDetection = (req, res) => {
  try {
    const { streams, start_date, end_date, algorithm_type = 'isolation_forest', contamination = 0.1 } = req.body;
    
    if (!streams || !Array.isArray(streams) || streams.length === 0) {
      return res.status(400).json({ error: 'Streams are required for anomaly detection' });
    }
    
    const result = performAnomalyDetection(streams, start_date, end_date, algorithm_type, contamination);
    res.json(result);
  } catch (err) {
    console.error('Error performing anomaly detection:', err);
    res.status(500).json({ error: 'Failed to perform anomaly detection' });
  }
};

// POST /export — Exports data in various formats
const getDataExport = (req, res) => {
  try {
    const { streams, start_date, end_date, format = 'json' } = req.body;
    
    if (!streams || !Array.isArray(streams) || streams.length === 0) {
      return res.status(400).json({ error: 'Streams are required for data export' });
    }
    
    const result = exportData(streams, start_date, end_date, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sensor_data.csv"');
      res.send(result);
    } else {
      res.json({ data: result });
    }
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

// GET /algorithms — Returns available algorithms
const getAvailableAlgorithmsController = (req, res) => {
  try {
    const algorithms = getAvailableAlgorithms();
    res.json(algorithms);
  } catch (err) {
    console.error('Error getting available algorithms:', err);
    res.status(500).json({ error: 'Failed to get available algorithms' });
  }
};

// GET /statistics — Returns dataset statistics
const getStatisticsController = (req, res) => {
  try {
    const stats = getStatistics();
    res.json(stats);
  } catch (err) {
    console.error('Error getting statistics:', err);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

module.exports = {
  getStreams,
  getStreamNames,
  postFilterStreams,
  getCorrelationAnalysis,
  getAnomalyDetection,
  getDataExport,
  getAvailableAlgorithms: getAvailableAlgorithmsController,
  getStatistics: getStatisticsController
};