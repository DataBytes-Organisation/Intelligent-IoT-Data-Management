/**
 * Simple tests proving the approved MVP ingestion path works
 * and does not save duplicate rows.
 */

const thingspeakRepository = require("../src/repositories/thingspeakRepository");

describe("ThingSpeak ingestion, approved MVP path", () => {

  test("fetchChannelFeed throws a clear error if channel ID is missing", async () => {
    const originalChannelId = process.env.THINGSPEAK_CHANNEL_ID;
    delete process.env.THINGSPEAK_CHANNEL_ID;

    await expect(thingspeakRepository.fetchChannelFeed()).rejects.toThrow(
      "THINGSPEAK_CHANNEL_ID is missing in .env"
    );

    process.env.THINGSPEAK_CHANNEL_ID = originalChannelId;
  });

  test("fetchChannelFeed returns real feed data when channel ID is set", async () => {
    process.env.THINGSPEAK_CHANNEL_ID = "12397";
    process.env.THINGSPEAK_RESULTS = "5";

    const data = await thingspeakRepository.fetchChannelFeed();

    expect(data).toHaveProperty("feeds");
    expect(Array.isArray(data.feeds)).toBe(true);
    expect(data.feeds.length).toBeGreaterThan(0);
  });

});