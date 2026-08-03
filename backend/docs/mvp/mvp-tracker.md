# MVP Tracker

## Shared Data Contract

### Field Mapping

The ThingSpeak fields were mapped across ingestion, database, analytics, and API layers.

- `field1` → `wind_direction_degrees`
- `field2` → `wind_speed_mph`
- `field3` → `humidity_percent`
- `field4` → `temperature_f`
- `field5` → `rain_inches_per_minute`
- `field6` → `pressure_hg`
- `field7` → `power_level_v`
- `field8` → `light_intensity`

The full mapping is documented in `data-contract.md`.

### Timestamp Rules

- ThingSpeak `created_at` is the original record timestamp.
- PostgreSQL stores it as `created_at`.
- API responses use the alias `recorded_at`.
- Timestamps use ISO 8601 UTC format.

### Null-Handling Rules

- Missing fields are stored as `null`.
- Empty strings are treated as `null`.
- Zero remains a valid sensor value.
- API responses preserve null values.
- Analytics must explicitly handle missing values.

### Temporary Aliases

Raw ThingSpeak field names remain in the ingestion and database layers for compatibility.

Descriptive API-safe aliases are used for analytics and API responses.

These aliases can be removed when all layers use the agreed descriptive names.