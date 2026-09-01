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

The backend successfully inserted Weather Station records and produced normalized output using:

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

# Backend to Analytics / Correlation Integration

## Correlation Contract

The Correlation team confirmed the current local service details.

Internal service base URL:

```text
http://127.0.0.1:5001
```

Correlation endpoint:

```text
POST /detect-correlation-alert
```

Health check:

```text
GET /service-status
```

Backend public route:

```text
POST /api/correlation-alert
```

The default Correlation method is `pearson`.

Supported methods are:

- `pearson`
- `spearman`

The internal Correlation service does not currently require authentication.

## Persisted Dataset Read

The backend now reads persisted dataset rows directly from PostgreSQL instead of echoing request data.

The flow is:

```text
Dataset name
→ PostgreSQL dataset ID
→ persisted timeseries rows
→ normalization
→ analytics-ready payload
```

The backend successfully read:

- `thingspeak-live`
- `thingspeak-co2`

## Analytics Payload Transformation

The backend transforms persisted rows into canonical sensor names before sending them to Correlation.

The normalized series is converted into the flat format required by the Correlation service.

Example:

```json
{
  "data": [
    {
      "timestamp": "2026-07-27T11:17:12.000Z",
      "wind_speed_mph": 1.1,
      "pressure_hg": 29.64
    }
  ],
  "timestamp_col": "timestamp",
  "selected_streams": [
    "wind_speed_mph",
    "pressure_hg"
  ],
  "window_size": 20,
  "step_size": 10,
  "method": "pearson"
}
```

The backend does not rely on the frontend to send sensor values. The frontend only selects the dataset, streams and Correlation settings.

## Correlation Client

A Correlation / Analytics HTTP client has been implemented in:

```text
backend/src/services/analyticsClientService.js
```

It includes:

- HTTP POST requests
- Configurable service URL
- Timeout handling
- Retry handling
- HTTP failure handling
- Missing service URL handling

The local Correlation service URL is configured through:

```text
CORRELATION_SERVICE_URL
```

The `.env` file is kept local and must not be committed.

## Correlation Service Integration

The backend now calls the real Correlation service through:

```text
POST /detect-correlation-alert
```

The public backend route is:

```text
POST /api/correlation-alert
```

The full working flow is:

```text
POST /api/correlation-alert
→ analyseController
→ analyseService
→ PostgreSQL
→ sensor normalization
→ Correlation payload
→ Correlation service
→ frontend-ready response
```

## Real Correlation Validation

The real Correlation service was successfully started locally on port `5001`.

The health endpoint returned successfully.

A real Correlation test was completed using:

```text
Dataset: thingspeak-live

Selected streams:
- wind_speed_mph
- pressure_hg

Window size: 20
Step size: 10
Method: pearson
```

The Correlation service successfully processed persisted PostgreSQL data.

One successful result included:

```text
processed_rows: 32
windows: 2
correlation_results: 2
```

A valid Pearson correlation value of:

```text
-0.1525
```

was returned between `wind_speed_mph` and `pressure_hg` in one analysis window.

## Correlation Compatibility Findings

During real integration testing, two compatibility issues were identified in the current local Correlation service.

### Timestamp Handling

The Correlation preprocessing originally converted timestamps using numeric conversion.

Backend ISO 8601 timestamps were converted to invalid values, which caused all rows to be removed.

For local integration testing, timestamp handling was updated to correctly parse ISO 8601 datetime values.

After the fix, all 32 rows were successfully processed.

### JSON NaN Handling

The Correlation response contained `NaN` values in some correlation matrices.

`NaN` is not valid JSON and caused the Node backend to fail while parsing the response.

For local testing, non-finite values were converted to JSON `null`.

After this compatibility fix, the backend successfully received and parsed the Correlation results.

These Correlation service changes are local testing changes and should be confirmed with the Correlation team before being included in shared Correlation code.

## Public API Validation

The public Backend API route was successfully tested:

```text
POST /api/correlation-alert
```

The latest public API test returned:

```text
dataset: thingspeak-live
dataset_id: 1
channel_id: 12397
row_count: 43

selected_streams:
- wind_speed_mph
- pressure_hg

status: correlation analysis completed
```

The Correlation service returned `status: success`.

## Failure API Validation

Failure handling was also tested.

The Python Correlation service was stopped while the Node backend remained running.

The same public API request then returned:

```json
{
  "error": "Correlation analysis failed",
  "message": "fetch failed"
}
```

This proves that the backend handles an unavailable Correlation service instead of crashing.

## Automated Tests

Automated tests are located in:

```text
backend/test/sensorFieldNormalizer.test.js
backend/test/analyseService.test.js
backend/test/analyticsClientService.test.js
```

Jest is used as the backend test framework.

Latest test result:

```text
Test Suites: 3 passed
Tests: 20 passed
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
- Persisted row transformation
- Confirmed flat Correlation payload
- Minimum selected stream validation
- Successful HTTP response handling
- HTTP failure handling
- Retry handling
- Timeout handling
- Missing service URL handling

## API Sample Payloads

Normalized sensor examples, Correlation contract details, success proof and failure proof are stored in:

```text
backend/docs/mvp/evidence/api-samples.json
```

## Data Contract

The complete channel mapping matrix, canonical names, units, timestamp rules, null rules and alias transition plan are documented in:

```text
backend/docs/mvp/data-contract.md
```

## Current Status

### Completed

- Mapping matrix for channels `12397` and `1350261`
- Canonical names and aliases defined
- Explicit alias transition plan documented
- Timestamp rules defined
- Null and numeric handling rules defined
- Sensor normalization implemented
- Normalization connected to ThingSpeak ingestion
- Persisted PostgreSQL dataset read implemented
- Analytics-ready row transformation implemented
- Correlation contract confirmed
- Correlation flat payload implemented
- Correlation service client implemented
- Timeout handling implemented
- Retry handling implemented
- HTTP error handling implemented
- Public `POST /api/correlation-alert` route implemented
- Real Correlation service connection tested
- Real Pearson Correlation result returned
- Public API success proof captured
- Public API failure proof captured
- 20 automated tests passed
- Evidence payloads updated

### Remaining

- Confirm local Correlation timestamp and `NaN` compatibility fixes with the Correlation team
- Confirm Anomaly detector, endpoint, response structure and score meaning with the Models team
- Implement and validate Anomaly service integration after contract confirmation
- Final Frontend / Analytics review of shared payloads and field names
