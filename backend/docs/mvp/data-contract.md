# MVP Data Contract

## Purpose

This document defines the shared field names used across ThingSpeak ingestion, PostgreSQL storage, analytics, and API responses.

## Data Flow

```text
ThingSpeak → Backend ingestion → PostgreSQL → Analytics → API response
```

## Field Mapping

| Meaning | ThingSpeak field | Backend field | Database field | Analytics/API field |
|---|---|---|---|---|
| Record identifier | `entry_id` | `entry_id` | `entry_id` | `entry_id` |
| Record timestamp | `created_at` | `created_at` | `created_at` | `recorded_at` |
| Wind direction | `field1` | `field1` | `field1` | `wind_direction_degrees` |
| Wind speed | `field2` | `field2` | `field2` | `wind_speed_mph` |
| Humidity | `field3` | `field3` | `field3` | `humidity_percent` |
| Temperature | `field4` | `field4` | `field4` | `temperature_f` |
| Rain rate | `field5` | `field5` | `field5` | `rain_inches_per_minute` |
| Pressure | `field6` | `field6` | `field6` | `pressure_hg` |
| Power level | `field7` | `field7` | `field7` | `power_level_v` |
| Light intensity | `field8` | `field8` | `field8` | `light_intensity` |

## Timestamp Rules

- ThingSpeak `created_at` is the original sensor timestamp.
- PostgreSQL stores it in the `created_at` column.
- API responses expose it as `recorded_at`.
- Timestamps use ISO 8601 UTC format.
- Example: `2026-08-03T01:31:20Z`.
- The original sensor timestamp must not be replaced by backend processing time.

## Null-Handling Rules

- Missing ThingSpeak field values are stored as `null`.
- Empty strings should be converted to `null`.
- Zero is a valid sensor value and must not be treated as missing.
- API responses must preserve `null` values.
- Analytics code must explicitly handle or filter null values.

## Naming Rules

- API-safe names use lowercase `snake_case`.
- Raw ThingSpeak names such as `field1` remain in the ingestion and database layers for compatibility.
- Descriptive names are used in analytics and API responses.
- Units are included in names where required.

## Temporary Aliases

| Current field | API-safe alias |
|---|---|
| `created_at` | `recorded_at` |
| `field1` | `wind_direction_degrees` |
| `field2` | `wind_speed_mph` |
| `field3` | `humidity_percent` |
| `field4` | `temperature_f` |
| `field5` | `rain_inches_per_minute` |
| `field6` | `pressure_hg` |
| `field7` | `power_level_v` |
| `field8` | `light_intensity` |

These aliases provide a safe transition while the current ingestion and database layers continue using the existing raw field names.

## Validation Rules

- `entry_id` must be an integer.
- `recorded_at` must be a valid ISO 8601 timestamp.
- Sensor measurements must be numeric or `null`.
- Wind direction is measured in degrees, where north is `0`.
- Temperature is measured in Fahrenheit.
- Wind speed is measured in miles per hour.
- Rain is measured in inches per minute.
- Pressure is measured in inches of mercury.
- Power level is measured in volts.