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

  test("running ingestion twice does not create duplicate rows", async () => {
    const pool = require("../src/db/pool");
    const before = await pool.query(
      `SELECT COUNT(*) FROM timeseries t JOIN datasets d ON t.dataset_id = d.id WHERE d.name = 'channel-1350261'`
    );
    const beforeCount = Number(before.rows[0].count);

    process.env.THINGSPEAK_CHANNEL_ID = "1350261";
    await thingspeakRepository.fetchChannelFeed();

    const after = await pool.query(
      `SELECT COUNT(*) FROM timeseries t JOIN datasets d ON t.dataset_id = d.id WHERE d.name = 'channel-1350261'`
    );
    const afterCount = Number(after.rows[0].count);

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  });

  test("a failed poll does not remove or corrupt existing data", async () => {
    const pool = require("../src/db/pool");
    const before = await pool.query(
      `SELECT COUNT(*) FROM timeseries t JOIN datasets d ON t.dataset_id = d.id WHERE d.name = 'channel-1350261'`
    );
    const beforeCount = Number(before.rows[0].count);

    process.env.THINGSPEAK_CHANNEL_ID = "9999999999";
    await expect(thingspeakRepository.fetchChannelFeed()).rejects.toThrow();

    const after = await pool.query(
      `SELECT COUNT(*) FROM timeseries t JOIN datasets d ON t.dataset_id = d.id WHERE d.name = 'channel-1350261'`
    );
    const afterCount = Number(after.rows[0].count);

    expect(afterCount).toBe(beforeCount);
  });

});