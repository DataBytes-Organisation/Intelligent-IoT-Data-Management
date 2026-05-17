const {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames,
} = require('../services/mockService');

/**
 * GET /api/streams
 * Optional query:
 *   ?metrics=Temperature,Wind Speed
 */
const getStreams = async (req, res) => {
  try {
    const { metrics } = req.query;

    if (!metrics) {
      const data = await readProcessedData();

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'No stream data found',
        });
      }

      return res.status(200).json(data);
    }

    const streamNames = metrics
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (streamNames.length === 0) {
      return res.status(400).json({
        error: 'metrics query parameter must contain at least one valid stream name',
      });
    }

    const availableStreamNames = await getAvailableStreamNames();

    const invalidStreamNames = streamNames.filter(
      (name) => !availableStreamNames.includes(name)
    );

    if (invalidStreamNames.length > 0) {
      return res.status(400).json({
        error: 'Invalid stream names provided',
        invalidStreamNames,
        availableStreamNames,
      });
    }

    const filteredData = await filterEntriesByStreamNames(streamNames);

    if (!filteredData || filteredData.length === 0) {
      return res.status(404).json({
        error: 'No filtered stream data found',
      });
    }

    return res.status(200).json(filteredData);
  } catch (err) {
    console.error('Error reading stream data:', err);
    return res.status(500).json({
      error: 'Failed to load stream data',
    });
  }
};

/**
 * GET /api/stream-names
 */
const getStreamNames = async (req, res) => {
  try {
    const streamNames = await getAvailableStreamNames();

    if (!streamNames || streamNames.length === 0) {
      return res.status(404).json({
        error: 'No stream names found',
      });
    }

    return res.status(200).json(streamNames);
  } catch (err) {
    console.error('Error getting stream names:', err);
    return res.status(500).json({
      error: 'Failed to get stream names',
    });
  }
};

/**
 * POST /api/filter-streams
 * Body:
 * {
 *   "streamNames": ["Temperature", "Wind Speed"]
 * }
 */
const postFilterStreams = async (req, res) => {
  try {
    const { streamNames } = req.body;

    if (!Array.isArray(streamNames) || streamNames.length === 0) {
      return res.status(400).json({
        error: 'streamNames must be a non-empty array',
      });
    }

    const cleanedStreamNames = streamNames
      .map((name) => String(name).trim())
      .filter((name) => name.length > 0);

    if (cleanedStreamNames.length === 0) {
      return res.status(400).json({
        error: 'streamNames must contain at least one valid stream name',
      });
    }

    const availableStreamNames = await getAvailableStreamNames();

    const invalidStreamNames = cleanedStreamNames.filter(
      (name) => !availableStreamNames.includes(name)
    );

    if (invalidStreamNames.length > 0) {
      return res.status(400).json({
        error: 'Invalid stream names provided',
        invalidStreamNames,
        availableStreamNames,
      });
    }

    const filteredData = await filterEntriesByStreamNames(cleanedStreamNames);

    if (!filteredData || filteredData.length === 0) {
      return res.status(404).json({
        error: 'No filtered stream data found',
      });
    }

    return res.status(200).json(filteredData);
  } catch (err) {
    console.error('Error filtering stream data:', err);
    return res.status(500).json({
      error: 'Failed to filter stream data',
    });
  }
};

module.exports = {
  getStreams,
  getStreamNames,
  postFilterStreams,
};