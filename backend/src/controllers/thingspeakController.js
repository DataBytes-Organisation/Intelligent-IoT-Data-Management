const { getThingSpeakFeeds } = require('../services/thingspeakService');

const fetchThingSpeakData = async (req, res) => {
  try {
    const data = await getThingSpeakFeeds();
    res.json(data);
  } catch (error) {
    console.error('Error fetching ThingSpeak data:', error.message);
    res.status(500).json({
      error: 'Failed to fetch ThingSpeak data',
      details: error.message,
    });
  }
};

module.exports = {
  fetchThingSpeakData,
};