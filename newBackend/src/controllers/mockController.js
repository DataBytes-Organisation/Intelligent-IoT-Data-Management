//handles HTTP request logic for mock data routes

const {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames
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

module.exports = {
  getStreams,
  getStreamNames,
  postFilterStreams
};