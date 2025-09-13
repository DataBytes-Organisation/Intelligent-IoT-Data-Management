// IoT-specific DTO mappers to keep outputs consistent

// For sensor data entries, ensure keys are ordered and explicit
const mapSensorDataDto = (entry) => {
  const { created_at, entry_id, device_id, sensor_id, was_interpolated, ...rest } = entry;
  return {
    created_at,
    entry_id,
    device_id,
    sensor_id,
    ...rest,
    ...(was_interpolated !== undefined ? { was_interpolated } : {})
  };
};

const mapSensorDataArrayDto = (entries) => entries.map(mapSensorDataDto);

// For device information
const mapDeviceDto = (device) => {
  const { device_id, name, type, location, status, last_seen, created_at, ...rest } = device;
  return {
    device_id,
    name,
    type,
    location,
    status,
    last_seen,
    created_at,
    ...rest
  };
};

const mapDevicesDto = (devices) => devices.map(mapDeviceDto);

// For sensor information
const mapSensorDto = (sensor) => {
  const { sensor_id, device_id, name, type, unit, min_value, max_value, created_at, ...rest } = sensor;
  return {
    sensor_id,
    device_id,
    name,
    type,
    unit,
    min_value,
    max_value,
    created_at,
    ...rest
  };
};

const mapSensorsDto = (sensors) => sensors.map(mapSensorDto);

// For data streams (backward compatibility)
const mapEntryDto = (entry) => {
  const { created_at, entry_id, was_interpolated, ...rest } = entry;
  return {
    created_at,
    entry_id,
    ...rest,
    ...(was_interpolated !== undefined ? { was_interpolated } : {})
  };
};

const mapEntriesDto = (entries) => entries.map(mapEntryDto);

module.exports = {
  // IoT-specific DTOs
  mapSensorDataDto,
  mapSensorDataArrayDto,
  mapDeviceDto,
  mapDevicesDto,
  mapSensorDto,
  mapSensorsDto,
  // Legacy DTOs for backward compatibility
  mapEntryDto,
  mapEntriesDto
};


