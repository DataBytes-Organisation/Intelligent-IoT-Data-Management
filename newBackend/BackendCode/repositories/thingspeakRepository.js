const fs = require("fs");
const path = require("path");

class ThingSpeakRepository {

  // Retrieves mock ThingSpeak data from local JSON file
  async getMockThingSpeakData() {
    try {
      const filePath = path.join(__dirname, "../mock_data/thingspeak.json");
      const rawData = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(rawData);
    } catch (error) {
      throw new Error("Failed to read mock data: " + error.message);
    }
  }

  // Fetches live data from ThingSpeak API (kept for future use)
  async fetchChannelFeed() {
    const channelId = process.env.THINGSPEAK_CHANNEL_ID;
    const readApiKey = process.env.THINGSPEAK_READ_API_KEY;
    const results = process.env.THINGSPEAK_RESULTS || 10;

    if (!channelId) {
      throw new Error("THINGSPEAK_CHANNEL_ID is missing in .env");
    }

    let url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=${results}`;

    if (readApiKey) {
      url += `&api_key=${readApiKey}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ThingSpeak request failed with status ${response.status}`);
    }

    return await response.json();
  }
}

module.exports = new ThingSpeakRepository();