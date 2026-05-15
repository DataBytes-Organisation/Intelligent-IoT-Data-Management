const thingspeakRepository = require('../repositories/thingspeakRepository');

const getThingSpeakFeeds = async () => {
  const rawData = await thingspeakRepository.getMockThingSpeakData();

  const cleanedFeeds = (rawData.feeds || []).map((feed) => {
    const temperature = feed.temperature !== undefined ? Number(feed.temperature) : null;
    const humidity = feed.humidity !== undefined ? Number(feed.humidity) : null;
    const pressure = feed.pressure !== undefined ? Number(feed.pressure) : null;

    return {
      entryId: feed.entryId,
      timestamp: feed.timestamp,
      temperature,
      humidity,
      pressure,
      anomaly:
        (temperature !== null && temperature > 30) ||
        (humidity !== null && humidity > 70) ||
        (pressure !== null && pressure < 1000),
    };
  });

  return {
    channel: rawData.channel || {},
    feeds: cleanedFeeds,
  };
};

module.exports = {
  getThingSpeakFeeds,
};