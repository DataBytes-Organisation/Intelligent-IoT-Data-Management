const INHG_TO_HPA = 33.8639;

// This is Backend configuration, used to seed the persisted mappings for a
// configured ThingSpeak channel. It is intentionally channel-specific: a
// ThingSpeak field number has no global meaning.
const CHANNEL_FIELD_MAPPINGS = Object.freeze({
  "12397": Object.freeze([
    Object.freeze({ storageField: "field3", sourceField: "humidity", displayName: "Humidity" }),
    Object.freeze({ storageField: "field4", sourceField: "temperature", displayName: "Temperature" }),
    Object.freeze({
      storageField: "field6",
      sourceField: "pressure",
      displayName: "Pressure",
      valueTransform: "inHgToHpa",
    }),
  ]),
  "1350261": Object.freeze([
    Object.freeze({ storageField: "field1", sourceField: "eco2", displayName: "eCO2" }),
    Object.freeze({ storageField: "field2", sourceField: "etvoc", displayName: "eTVOC" }),
    Object.freeze({ storageField: "field3", sourceField: "temperature", displayName: "Temperature" }),
    Object.freeze({ storageField: "field4", sourceField: "air_pressure", displayName: "Air pressure" }),
    Object.freeze({ storageField: "field5", sourceField: "humidity", displayName: "Humidity" }),
    Object.freeze({ storageField: "field6", sourceField: "temperature_secondary", displayName: "Secondary temperature" }),
    Object.freeze({ storageField: "field7", sourceField: "controller_temperature", displayName: "Controller temperature" }),
    Object.freeze({ storageField: "field8", sourceField: "conductance", displayName: "Conductance" }),
  ]),
});

function mappingsForChannel(channelId) {
  return CHANNEL_FIELD_MAPPINGS[String(channelId)] || null;
}

function transformFor(valueTransform) {
  if (valueTransform === "inHgToHpa") return (value) => value * INHG_TO_HPA;
  return null;
}

function fieldMapFromMappings(mappings, channelId) {
  const configuredMappings = mappingsForChannel(channelId) || [];
  const configuredByStorageField = new Map(
    configuredMappings.map((mapping) => [mapping.storageField, mapping]),
  );

  return Object.fromEntries(
    mappings.map((mapping) => {
      const configured = configuredByStorageField.get(mapping.storageField);
      const transform = transformFor(configured?.valueTransform);
      return [
        mapping.storageField,
        transform ? { name: mapping.sourceField, transform } : mapping.sourceField,
      ];
    }),
  );
}

function fieldMapForChannel(channelId) {
  const mappings = mappingsForChannel(channelId);
  return mappings ? fieldMapFromMappings(mappings, channelId) : null;
}

module.exports = {
  CHANNEL_FIELD_MAPPINGS,
  fieldMapForChannel,
  fieldMapFromMappings,
  mappingsForChannel,
};
