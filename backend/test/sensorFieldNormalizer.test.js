const {
  normalizeNumericValue,
  normalizeTimestamp,
  normalizeThingSpeakFeed
} = require("../src/services/sensorFieldNormalizer");

describe("sensorFieldNormalizer", () => {

  test("converts numeric strings to numbers", () => {
    expect(normalizeNumericValue("24.5")).toBe(24.5);
  });

  test("keeps zero as a valid value", () => {
    expect(normalizeNumericValue("0")).toBe(0);
    expect(normalizeNumericValue(0)).toBe(0);
  });

  test("converts missing values to null", () => {
    expect(normalizeNumericValue("")).toBeNull();
    expect(normalizeNumericValue(null)).toBeNull();
    expect(normalizeNumericValue(undefined)).toBeNull();
  });

  test("converts invalid numeric values to null", () => {
    expect(normalizeNumericValue("abc")).toBeNull();
  });

  test("normalizes timestamp to ISO 8601 UTC", () => {
    expect(
      normalizeTimestamp("2026-08-09T08:20:05Z")
    ).toBe("2026-08-09T08:20:05.000Z");
  });

  test("returns null for invalid timestamp", () => {
    expect(normalizeTimestamp("invalid-date")).toBeNull();
  });

  test("normalizes channel 12397 fields", () => {
    const feed = {
      created_at: "2026-08-09T08:00:00Z",
      entry_id: 100,
      field1: "0",
      field2: "5.3",
      field3: "10",
      field4: "78.1",
      field5: "0",
      field6: "29.71",
      field7: "0",
      field8: "12"
    };

    const result = normalizeThingSpeakFeed(12397, feed);

    expect(result.channel_id).toBe(12397);
    expect(result.entry_id).toBe(100);
    expect(result.recorded_at).toBe("2026-08-09T08:00:00.000Z");
    expect(result.wind_direction_degrees).toBe(0);
    expect(result.wind_speed_mph).toBe(5.3);
    expect(result.humidity_percent).toBe(10);
    expect(result.temperature_f).toBe(78.1);
    expect(result.pressure_hg).toBe(29.71);
  });

  test("normalizes channel 1350261 fields", () => {
    const feed = {
      created_at: "2026-08-09T08:20:05Z",
      entry_id: 276951,
      field1: "556.5",
      field2: "148.8",
      field3: "25.47",
      field4: "983.30",
      field5: "46.91",
      field6: "24.52",
      field7: "52.50",
      field8: "1.12"
    };

    const result = normalizeThingSpeakFeed(1350261, feed);

    expect(result.channel_id).toBe(1350261);
    expect(result.eco2_ppm).toBe(556.5);
    expect(result.etvoc_ppb).toBe(148.8);
    expect(result.temperature_c).toBe(25.47);
    expect(result.air_pressure_hpa).toBe(983.3);
    expect(result.humidity_percent).toBe(46.91);
    expect(result.controller_temperature_c).toBe(52.5);
    expect(result.conductance_us).toBe(1.12);
  });

  test("uses different mappings for different channels", () => {
    const feed = {
      created_at: "2026-08-09T08:00:00Z",
      entry_id: 1,
      field1: "100"
    };

    const weather = normalizeThingSpeakFeed(12397, feed);
    const co2 = normalizeThingSpeakFeed(1350261, feed);

    expect(weather.wind_direction_degrees).toBe(100);
    expect(co2.eco2_ppm).toBe(100);
  });

  test("throws error for unsupported channel", () => {
    expect(() => {
      normalizeThingSpeakFeed(99999, {});
    }).toThrow("Unsupported ThingSpeak channel");
  });

});