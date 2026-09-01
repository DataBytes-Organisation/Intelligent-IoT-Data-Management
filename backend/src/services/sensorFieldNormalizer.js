const CHANNEL_MAPPINGS = {
  "12397": {
    field1: "wind_direction_degrees",
    field2: "wind_speed_mph",
    field3: "humidity_percent",
    field4: "temperature_f",
    field5: "rain_inches_per_minute",
    field6: "pressure_hg",
    field7: "power_level_v",
    field8: "light_intensity"
  },

  "1350261": {
    field1: "eco2_ppm",
    field2: "etvoc_ppb",
    field3: "temperature_c",
    field4: "air_pressure_hpa",
    field5: "humidity_percent",
    field6: "temperature_secondary_c",
    field7: "controller_temperature_c",
    field8: "conductance_us"
  }
};

function normalizeNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeThingSpeakFeed(channelId, feed) {
  const mapping = CHANNEL_MAPPINGS[String(channelId)];

  if (!mapping) {
    throw new Error(`Unsupported ThingSpeak channel: ${channelId}`);
  }

  const normalized = {
    channel_id: Number(channelId),
    entry_id: feed.entry_id ?? null,
    recorded_at: normalizeTimestamp(feed.created_at)
  };

  for (const [rawField, canonicalName] of Object.entries(mapping)) {
    normalized[canonicalName] = normalizeNumericValue(feed[rawField]);
  }

  return normalized;
}

module.exports = {
  CHANNEL_MAPPINGS,
  normalizeNumericValue,
  normalizeTimestamp,
  normalizeThingSpeakFeed
};