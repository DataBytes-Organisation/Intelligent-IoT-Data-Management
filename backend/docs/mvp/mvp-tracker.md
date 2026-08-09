# MVP Tracker

## Shared Sensor Field Contract

### Channel Mapping

Separate field mappings have been created for ThingSpeak channels `12397` and `1350261`.

The same ThingSpeak field number is not assumed to have the same meaning across different channels.

#### Channel 12397 – Weather Station

- `field1` → `wind_direction_degrees`
- `field2` → `wind_speed_mph`
- `field3` → `humidity_percent`
- `field4` → `temperature_f`
- `field5` → `rain_inches_per_minute`
- `field6` → `pressure_hg`
- `field7` → `power_level_v`
- `field8` → `light_intensity`

#### Channel 1350261 – CO2 Measurement

- `field1` → `eco2_ppm`
- `field2` → `etvoc_ppb`
- `field3` → `temperature_c`
- `field4` → `air_pressure_hpa`
- `field5` → `humidity_percent`
- `field6` → `temperature_secondary_c`
- `field7` → `controller_temperature_c`
- `field8` → `conductance_us`

## Canonical Names and Aliases

API-safe canonical names have been defined for both ThingSpeak channels.

The current backend and PostgreSQL database still use raw names such as `field1` to `field8`. These raw field names are kept temporarily so the existing backend flow is not broken.

New Analytics, Correlation and API consumers should use the canonical field names.

The old aliases should only be removed after Frontend and Analytics confirm the field names and units and all existing consumers have moved to the canonical names.

## Timestamp Rules

- ThingSpeak `created_at` is used as the original sensor timestamp.
- PostgreSQL continues to store the timestamp as `created_at`.
- Normalized API output uses `recorded_at`.
- Timestamps are converted to ISO 8601 UTC format.
- Invalid timestamps are converted to `null`.

Example:

```text
2026-08-09T08:57:28.000Z
```

## Null and Numeric Handling

- Missing values are converted to `null`.
- Empty strings are converted to `null`.
- Existing `null` values remain `null`.
- Invalid numeric values are converted to `null`.
- Numeric strings are converted to numbers.
- Zero remains a valid sensor value.

Examples:

```text
"24.5" → 24.5
"0" → 0
"" → null
null → null
"abc" → null
```

## Normalization Implementation

Sensor-field normalization has been implemented in:

```text
backend/src/services/sensorFieldNormalizer.js
```

The normalizer selects the correct field mapping based on the ThingSpeak channel ID.

For example:

```text
Channel 12397:
field1 → wind_direction_degrees

Channel 1350261:
field1 → eco2_ppm
```

The normalization is also connected to the ThingSpeak ingestion flow in:

```text
backend/src/dataIngestion/thingSpeakInjest.js
```

The existing PostgreSQL storage continues using `field1` to `field8` so current functionality is not broken, while normalized names are produced for Analytics and API use.

## Runtime Validation

Normalization was successfully tested using live ThingSpeak data for both supported channels.

### Channel 12397

The backend successfully inserted a Weather Station record and produced normalized output using:

- `wind_direction_degrees`
- `wind_speed_mph`
- `humidity_percent`
- `temperature_f`
- `rain_inches_per_minute`
- `pressure_hg`
- `power_level_v`
- `light_intensity`

### Channel 1350261

The backend successfully inserted a CO2 Measurement record and produced normalized output using:

- `eco2_ppm`
- `etvoc_ppb`
- `temperature_c`
- `air_pressure_hpa`
- `humidity_percent`
- `temperature_secondary_c`
- `controller_temperature_c`
- `conductance_us`

## Automated Tests

Automated tests were added in:

```text
backend/test/sensorFieldNormalizer.test.js
```

Jest was added as the backend test framework.

Test result:

```text
Test Suites: 1 passed
Tests: 10 passed
```

The tests cover:

- Numeric conversion
- Zero handling
- Missing values
- Invalid numeric values
- ISO 8601 UTC timestamps
- Invalid timestamps
- Channel `12397` mapping
- Channel `1350261` mapping
- Different mappings between channels
- Unsupported channel handling

## API Sample Payloads

Normalized payload examples for both ThingSpeak channels are stored in:

```text
backend/docs/mvp/evidence/api-samples.json
```

The examples show canonical field names, channel-specific mappings, normalized timestamps and numeric values.

## Data Contract

The complete channel mapping matrix, canonical names, units, timestamp rules, null rules and alias transition plan are documented in:

```text
backend/docs/mvp/data-contract.md
```

## Current Status

Completed:

- Mapping matrix for channels `12397` and `1350261`
- Canonical names and aliases defined
- Explicit alias transition plan documented
- Timestamp rules defined
- Null and numeric handling rules defined
- Sensor normalization implemented
- Normalization connected to ThingSpeak ingestion
- Automated tests added
- 10 automated tests passed
- Live runtime validation completed for both channels
- Normalized API sample payloads created

Remaining:

- Frontend and Analytics review of the proposed canonical names, units and normalized payload examples
- Update any field names requested during the review