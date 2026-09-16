const thingspeakRepository = require('../repositories/thingspeakRepository');
const pool = require('../db/pool');
const TimeseriesRepository = require('../repositories/timeseriesRepository');

const timeseriesRepository = new TimeseriesRepository();
const THINGSPEAK_DATASET_NAME =
  process.env.THINGSPEAK_DATASET_NAME || 'thingspeak-live';

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

const saveThingSpeakRawDataToDatabase = async (rawData) => {
  const feeds = rawData.feeds || [];

  if (feeds.length === 0) {
    return 0;
  }

  const datasetResult = await pool.query(
    `INSERT INTO datasets (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [THINGSPEAK_DATASET_NAME]
  );

  const datasetId = datasetResult.rows[0].id;

  const metricKeys = Object.keys(feeds[0]).filter((key) =>
    key.startsWith('field')
  );

  let savedCount = 0;

  for (const feed of feeds) {
    const fields = Object.fromEntries(
      metricKeys.map((key) => [key, feed[key] ?? null])
    );

    await timeseriesRepository.insertWideRow(
      datasetId,
      feed.created_at,
      feed.entry_id,
      fields
    );

    savedCount += 1;
  }

  return savedCount;
};

const THINGSPEAK_POLL_INTERVAL_MS =
  Number(process.env.THINGSPEAK_POLL_INTERVAL_MS) || 60000;

let latestThingSpeakData = null;
let isThingSpeakPollingStarted = false;

const THINGSPEAK_MAX_RETRIES =
  Number(process.env.THINGSPEAK_MAX_RETRIES) || 3;

const THINGSPEAK_RETRY_DELAY_MS =
  Number(process.env.THINGSPEAK_RETRY_DELAY_MS) || 2000;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchThingSpeakWithRetry = async () => {
  let lastError;

  for (let attempt = 1; attempt <= THINGSPEAK_MAX_RETRIES; attempt += 1) {
    try {
      return await thingspeakRepository.fetchChannelFeed();
    } catch (error) {
      lastError = error;

      console.warn(
        `ThingSpeak fetch attempt ${attempt} failed:`,
        error.message
      );

      if (attempt < THINGSPEAK_MAX_RETRIES) {
        await wait(THINGSPEAK_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
};

const pollThingSpeakData = async () => {
  try {
    // latestThingSpeakData = await fetchThingSpeakWithRetry();
    // await thingspeakRepository.saveThingSpeakData(latestThingSpeakData);
    // const latestFeed =
    //   latestThingSpeakData.feeds[latestThingSpeakData.feeds.length - 1];

    const rawData = await fetchThingSpeakWithRetry();
    const savedCount = await saveThingSpeakRawDataToDatabase(rawData);

    latestThingSpeakData = {
      channel: rawData.channel || {},
      feeds: (rawData.feeds || []).map((feed) => ({
        entryId: feed.entry_id,
        timestamp: feed.created_at,
        temperature: feed.field4 !== undefined ? Number(feed.field4) : null,
        humidity: feed.field3 !== undefined ? Number(feed.field3) : null,
        pressure:
          feed.field6 !== undefined ? Number(feed.field6) * 33.8639 : null,
        anomaly:
          (feed.field4 !== undefined && Number(feed.field4) > 30) ||
          (feed.field3 !== undefined && Number(feed.field3) > 70) ||
          (feed.field6 !== undefined && Number(feed.field6) * 33.8639 < 1000),
      })),
    };

    const latestFeed =
      latestThingSpeakData.feeds[latestThingSpeakData.feeds.length - 1];

    console.log("ThingSpeak poll successful:", {
      checkedAt: new Date().toISOString(),
      channelId: latestThingSpeakData.channel.id,
      // feedCount: latestThingSpeakData.feeds.length,
      // latestEntryId: latestFeed ? latestFeed.entryId : null,
      feedCount: latestThingSpeakData.feeds.length,
      savedCount,
      datasetName: THINGSPEAK_DATASET_NAME,
      latestEntryId: latestFeed ? latestFeed.entryId : null,
    });
  } catch (error) {
    console.error("ThingSpeak poll failed:", {
      checkedAt: new Date().toISOString(),
      message: error.message,
    });
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
  fetchThingSpeakWithRetry,
  saveThingSpeakRawDataToDatabase,
};