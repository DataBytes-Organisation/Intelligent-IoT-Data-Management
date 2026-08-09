# MVP Data Contract

## Purpose

This document defines the shared sensor-field contract used across ThingSpeak ingestion, PostgreSQL storage, Analytics/Correlation processing, and API responses.

The purpose is to make sure that each ThingSpeak channel has its own approved field mapping and that Frontend and Analytics consumers do not need to understand raw ThingSpeak field numbers such as `field1` to `field8`.

## Data Flow

```text
ThingSpeak
→ Backend ingestion
→ PostgreSQL
→ Analytics / Correlation
→ API response
```

## Channel Mapping Matrix

ThingSpeak field numbers are channel-specific. The same field number must not be assumed to have the same meaning or unit across different channels.

### Channel 12397 – Weather Station

| ThingSpeak Field | Source Meaning | Unit | Proposed Canonical Name |
|---|---|---|---|
| `field1` | Wind Direction | degrees | `wind_direction_degrees` |
| `field2` | Wind Speed | mph | `wind_speed_mph` |
| `field3` | Humidity | % | `humidity_percent` |
| `field4` | Temperature | °F | `temperature_f` |
| `field5` | Rain | inches/minute | `rain_inches_per_minute` |
| `field6` | Pressure | inHg | `pressure_hg` |
| `field7` | Power Level | V | `power_level_v` |
| `field8` | Light Intensity | source-defined | `light_intensity` |

### Channel 1350261 – CO2 Measurement

| ThingSpeak Field | Source Meaning | Unit | Proposed Canonical Name |
|---|---|---|---|
| `field1` | eCO2 | ppm | `eco2_ppm` |
| `field2` | eTVOC | ppb | `etvoc_ppb` |
| `field3` | Temperature | °C | `temperature_c` |
| `field4` | Air Pressure at 300m a.s.l. | hPa | `air_pressure_hpa` |
| `field5` | Humidity | % | `humidity_percent` |
| `field6` | Temperature | °C | `temperature_secondary_c` |
| `field7` | Controller Temperature | °C | `controller_temperature_c` |
| `field8` | G | µS | `conductance_us` |

## Mapping Rules

- Channel `12397` and channel `1350261` must use separate field mappings.
- A raw field such as `field1` must only be interpreted together with its channel ID.
- Raw ThingSpeak field names may remain in the ingestion and database layers during the transition.
- Analytics, Correlation and API consumers should use the canonical names.
- Frontend and Analytics should not need to know the ThingSpeak field numbers.
- Canonical names and units should be confirmed by the Frontend and Analytics teams before legacy aliases are removed.

## Canonical Naming Rules

- Canonical names use lowercase `snake_case`.
- Names should describe the real meaning of the sensor value.
- Units should be included in the canonical name where they are important.
- The same canonical name should only be reused when the meaning and unit are the same.
- Channel-specific differences must remain explicit.

## Timestamp Rules

- ThingSpeak `created_at` is treated as the original sensor timestamp.
- PostgreSQL stores the original timestamp in `created_at`.
- Normalized API responses expose the timestamp as `recorded_at`.
- Normalized timestamps must use ISO 8601 UTC format.
- Example:

```text
2026-08-09T08:00:00.000Z
```

- The original sensor timestamp must not be replaced by backend processing time.
- Invalid timestamps should not be silently accepted and should be handled as invalid input.

## Numeric Conversion Rules

ThingSpeak values may arrive as strings.

Valid numeric strings should be converted to numbers.

Examples:

```text
"24.5" → 24.5
"0"    → 0
"556.5" → 556.5
```

The value `0` is valid and must not be treated as missing.

Values that cannot be converted to valid numbers should be represented as `null` or rejected according to the API validation behaviour.

Example:

```text
"abc" → null
```

## Null and Missing-Value Rules

- Missing ThingSpeak values are represented as `null`.
- Empty strings are converted to `null`.
- `undefined` or missing fields are normalized to `null`.
- Existing `null` values remain `null`.
- Zero remains a valid measurement.
- API responses preserve `null` values.
- Analytics and Correlation code must explicitly handle missing values.
- Missing values must not automatically be converted to zero.

Examples:

```text
""        → null
null      → null
undefined → null
"0"       → 0
0         → 0
```

## Temporary Alias Transition Plan

The existing backend and PostgreSQL implementation currently uses raw ThingSpeak names such as `field1` to `field8`.

These aliases will remain temporarily so current functionality is not broken.

New Analytics, Correlation and API consumers should use the canonical names.

### Channel 12397 Alias Plan

| Existing Alias | Canonical Name | Transition Plan |
|---|---|---|
| `field1` | `wind_direction_degrees` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field2` | `wind_speed_mph` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field3` | `humidity_percent` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field4` | `temperature_f` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field5` | `rain_inches_per_minute` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field6` | `pressure_hg` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field7` | `power_level_v` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field8` | `light_intensity` | Keep temporarily for existing consumers. New consumers use the canonical name. |

### Channel 1350261 Alias Plan

| Existing Alias | Canonical Name | Transition Plan |
|---|---|---|
| `field1` | `eco2_ppm` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field2` | `etvoc_ppb` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field3` | `temperature_c` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field4` | `air_pressure_hpa` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field5` | `humidity_percent` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field6` | `temperature_secondary_c` | Keep temporarily until the exact sensor role is confirmed by Analytics. |
| `field7` | `controller_temperature_c` | Keep temporarily for existing consumers. New consumers use the canonical name. |
| `field8` | `conductance_us` | Keep temporarily until the final canonical meaning is confirmed. |

## Alias Removal Conditions

The raw `field1` to `field8` aliases should only be removed after:

- Frontend and Analytics confirm the canonical names and units.
- Existing consumers are updated to use canonical names.
- Normalized payload tests pass.
- API sample payloads are reviewed.
- No existing backend, Analytics or Correlation service depends only on the raw ThingSpeak field numbers.

## Validation Rules

### Common Rules

- `entry_id` must be an integer.
- `recorded_at` must be a valid ISO 8601 UTC timestamp.
- Sensor measurements must be numeric or `null`.
- Missing values must follow the null-handling rules.
- Invalid numeric strings must not be silently treated as valid values.

### Channel 12397

- `wind_direction_degrees` is measured in degrees.
- `wind_speed_mph` is measured in miles per hour.
- `humidity_percent` is measured as a percentage.
- `temperature_f` is measured in Fahrenheit.
- `rain_inches_per_minute` is measured in inches per minute.
- `pressure_hg` is measured in inches of mercury.
- `power_level_v` is measured in volts.

### Channel 1350261

- `eco2_ppm` is measured in parts per million.
- `etvoc_ppb` is measured in parts per billion.
- `temperature_c` is measured in Celsius.
- `air_pressure_hpa` is measured in hectopascals.
- `humidity_percent` is measured as a percentage.
- `temperature_secondary_c` is measured in Celsius.
- `controller_temperature_c` is measured in Celsius.
- `conductance_us` is measured in microsiemens.

## Normalized Output Requirement

The normalized API and Analytics output should use canonical names instead of raw ThingSpeak field numbers.

Example for channel `12397`:

```json
{
  "channel_id": 12397,
  "entry_id": 5688164,
  "recorded_at": "2026-08-09T08:00:00.000Z",
  "wind_direction_degrees": 0,
  "wind_speed_mph": 5.3,
  "humidity_percent": 10,
  "temperature_f": 78.1,
  "rain_inches_per_minute": 0,
  "pressure_hg": 29.71,
  "power_level_v": 0,
  "light_intensity": 0
}
```

Example for channel `1350261`:

```json
{
  "channel_id": 1350261,
  "entry_id": 276951,
  "recorded_at": "2026-08-09T08:20:05.000Z",
  "eco2_ppm": 556.5,
  "etvoc_ppb": 148.8,
  "temperature_c": 25.47,
  "air_pressure_hpa": 983.3,
  "humidity_percent": 46.91,
  "temperature_secondary_c": 24.52,
  "controller_temperature_c": 52.5,
  "conductance_us": 1.12
}
```

## Review Requirement

Before removing temporary aliases, the proposed canonical names, units and normalized payloads should be reviewed by the Frontend and Analytics teams.

Any requested changes should be updated in this document and in the backend normalization implementation.