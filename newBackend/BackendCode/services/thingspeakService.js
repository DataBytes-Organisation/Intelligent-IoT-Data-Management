const thingspeakRepository = require('../repositories/thingspeakRepository');

const getThingSpeakFeeds = async () => {
  //const rawData = await thingspeakRepository.getMockThingSpeakData();
  const rawData = await thingspeakRepository.fetchChannelFeed();

  // const cleanedFeeds = (rawData.feeds || []).map((feed) => {
  //   const temperature = feed.temperature !== undefined ? Number(feed.temperature) : null;
  //   const humidity = feed.humidity !== undefined ? Number(feed.humidity) : null;
  //   const pressure = feed.pressure !== undefined ? Number(feed.pressure) : null;

  //   return {
  //     entryId: feed.entryId,
  //     timestamp: feed.timestamp,
  //     temperature,
  //     humidity,
  //     pressure,
  //     anomaly:
  //       (temperature !== null && temperature > 30) ||
  //       (humidity !== null && humidity > 70) ||
  //       (pressure !== null && pressure < 1000),
  //   };
  // });
  const cleanedFeeds = (rawData.feeds || []).map((feed) => {
    const temperature = feed.field4 !== undefined ? Number(feed.field4) : null;
    const humidity = feed.field3 !== undefined ? Number(feed.field3) : null;

    // ThingSpeak public test channel 12397 gives pressure in inches of mercury.
    // Convert it to hPa so the existing pressure rule still makes sense.
    const pressure =
      feed.field6 !== undefined ? Number(feed.field6) * 33.8639 : null;

    return {
      entryId: feed.entry_id,
      timestamp: feed.created_at,
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

const THINGSPEAK_POLL_INTERVAL_MS =
  Number(process.env.THINGSPEAK_POLL_INTERVAL_MS) || 60000;

let latestThingSpeakData = null;
let isThingSpeakPollingStarted = false;

const pollThingSpeakData = async () => {
  try {
    latestThingSpeakData = await getThingSpeakFeeds();

    console.log(
      "ThingSpeak poll successful. Feeds loaded:",
      latestThingSpeakData.feeds.length
    );
  } catch (error) {
    console.error("ThingSpeak poll failed:", error.message);
  }
};

const startThingSpeakPolling = () => {
  if (isThingSpeakPollingStarted) {
    return;
  }

  isThingSpeakPollingStarted = true;

  console.log(
    "ThingSpeak polling started. Interval:",
    THINGSPEAK_POLL_INTERVAL_MS,
    "ms"
  );

  pollThingSpeakData();
  setInterval(pollThingSpeakData, THINGSPEAK_POLL_INTERVAL_MS);
};

module.exports = {
  getThingSpeakFeeds,
  startThingSpeakPolling,
};