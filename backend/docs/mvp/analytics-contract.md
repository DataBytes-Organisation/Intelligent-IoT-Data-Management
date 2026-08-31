# Analytics Contract: Backend Data vs Correlation & Anomaly Service Inputs

## Purpose

This document records the current shape of data stored in our backend database, compares it against what the correlation and anomaly detection services expect, and identifies mismatches. It was produced by investigating the actual backend and correlation_alert source code directly, not just documentation, and by running real ingestion against ThingSpeak channel 12397 to confirm findings against live data.

## Current Stored Data Shape

Two different storage formats exist in the database, depending on ingestion source.

### 1. Wide format (ThingSpeak ingestion), table: `timeseries`

Columns: `dataset_id, created_at, entry_id, field1...field8`

Real example row (channel 12397, entry_id 5683301):

dataset_id | created_at              | entry_id | field1 | field2 | field3 | field4 | field5 | field6 | field7 | field8
1          | 2026-07-30 21:36:15+10  | 5683301  | 170    | 3.9    | 0      | 0.1    | 0      | 29.52  | 0      | 0

Field labels are generic, inherited directly from ThingSpeak's own naming convention. Real meaning is only available via ThingSpeak's channel metadata, not stored in our own schema:

- field1: Wind Direction (degrees)
- field2: Wind Speed (mph)
- field3: % Humidity
- field4: Temperature (F)
- field5: Rain (inches/minute)
- field6: Pressure (inHg)
- field7: Power Level (V)
- field8: Light Intensity

### 2. Long format (CSV ingestion), table: `timeseries_long`

Columns: `ts, entity, metric, value`

This format already stores a real metric name per row and is structurally closer to a typical analytics-ready shape, one reading, one named metric, one row.

## What the Correlation Service Expects

Confirmed via `correlation_alert/testing/run_real_dataset.py` and its recorded output `real_alerts.json`:

- Endpoint: `POST /detect-correlation-alert`
- Input: CSV file upload (multipart/form-data), not JSON or direct DB rows
- Required parameters: `timestamp_col`, `selected_streams` (list of column names), `window_size`, `step_size`, `method` (pearson/spearman)
- Confirmed: the service works with generic field names (`field1`...`field8`) passed directly as `selected_streams`, no renaming required for the correlation math itself
- However, output alerts are also labeled using whatever names were passed in (e.g. "stream_pair": ["field1", "field5"]), so if generic names go in, the human-readable meaning is lost on the way out

## What the Anomaly Service Expects

No documented API contract could be found for the anomaly detection service. Unlike correlation, no standalone endpoint with a defined request/response format was identified in the docs, handover materials, or repo structure reviewed. This absence is itself logged as a mismatch, see mvp-tracker.md.

## Summary

| Requirement | Current State |
|---|---|
| Correlation service can technically process wide-format data | Yes, accepts generic field names directly |
| Correlation output is human-readable | No, output uses the same generic labels as input |
| Anomaly service input contract | Undocumented / unknown |
| Backend has a working connector to either service | No, /api/analyse is a placeholder stub |
| A field-name translation layer exists | Partially, hardcoded for 3 of 8 fields, for one specific test channel only |

Full details of each mismatch are recorded in mvp-tracker.md. A sample transformed payload is recorded in evidence/api-samples.json.

## Caveat

Findings are based on the public ThingSpeak test channel (12397), used as a placeholder pending the official project channel. Structural findings, data shape, format, and API expectations, remain valid regardless of which channel is used. Field-specific values may need revisiting once the real project channel is confirmed.

# Analytics / Correlation Contract

## Purpose

This document describes the current Backend to Analytics / Correlation integration contract.

The backend reads persisted sensor data from PostgreSQL, normalizes the sensor fields, prepares the required Correlation payload, calls the Correlation service and returns the result through a backend API route.

## Correlation Service

### Local Base URL

```text
http://127.0.0.1:5001
```

The backend reads this value from:

```text
CORRELATION_SERVICE_URL
```

The value is stored locally in `.env`.

The `.env` file must not be committed.

## Correlation Endpoint

Internal Correlation endpoint:

```text
POST /detect-correlation-alert
```

Health check:

```text
GET /service-status
```

Backend public endpoint:

```text
POST /api/correlation-alert
```

## Authentication

The internal Correlation service does not currently require authentication.

Authentication for the backend public API can be added separately if required by the project.

## Backend Public Request

Example request:

```json
{
  "datasetName": "thingspeak-live",
  "selectedStreams": [
    "wind_speed_mph",
    "pressure_hg"
  ],
  "windowSize": 20,
  "stepSize": 10,
  "method": "pearson"
}
```

The frontend does not send the actual sensor values.

The backend uses `datasetName` to read persisted sensor data from PostgreSQL.

## Backend to Correlation Payload

The backend converts the persisted sensor rows into the flat payload required by the Correlation service.

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

## Correlation Methods

The default method is:

```text
pearson
```

Supported methods are:

- `pearson`
- `spearman`

## Correlation Response

The Correlation service returns data including:

```json
{
  "status": "success",
  "summary": {},
  "correlations": [],
  "changes": [],
  "alerts": []
}
```

The Correlation team also confirmed that changes and alerts can contain information such as:

- `stream_1`
- `stream_2`
- `previous_corr`
- `current_corr`
- `delta`
- window timestamps

Alerts may also contain:

- `alert_level`
- `reason`

## Backend Response

The backend returns the Correlation result together with dataset context.

Example:

```json
{
  "dataset": "thingspeak-live",
  "dataset_id": 1,
  "channel_id": 12397,
  "row_count": 43,
  "selected_streams": [
    "wind_speed_mph",
    "pressure_hg"
  ],
  "correlation": {
    "status": "success"
  },
  "status": "correlation analysis completed"
}
```

## Persisted Data Flow

The backend uses persisted PostgreSQL data.

The flow is:

```text
Dataset name
→ dataset ID
→ persisted timeseries rows
→ canonical sensor normalization
→ flat Correlation payload
→ Correlation service
→ backend response
```

## Timeout and Retry Rules

The Analytics client supports configurable timeout and retry handling.

Environment variables:

```text
ANALYTICS_TIMEOUT_MS=5000
ANALYTICS_MAX_RETRIES=2
```

Current behaviour:

- HTTP request timeout is configurable.
- Failed service calls can be retried.
- HTTP failure responses are handled.
- Missing service URLs are handled.
- An unavailable Correlation service returns a controlled backend error instead of crashing the backend.

## Failure Response

When the Correlation service is unavailable, the backend returns a response such as:

```json
{
  "error": "Correlation analysis failed",
  "message": "fetch failed"
}
```

## Integration Validation

The Correlation integration has been tested using persisted PostgreSQL data from:

```text
thingspeak-live
```

Selected streams:

```text
wind_speed_mph
pressure_hg
```

Configuration:

```text
window_size: 20
step_size: 10
method: pearson
```

A successful test produced:

```text
processed_rows: 32
windows: 2
correlation_results: 2
```

One returned Pearson correlation value was:

```text
-0.1525
```

## Compatibility Findings

### Timestamp Handling

The backend sends ISO 8601 UTC timestamps.

During local testing, the Correlation preprocessing initially attempted numeric timestamp conversion, which removed the backend rows.

The local Correlation preprocessing was adjusted to parse ISO 8601 timestamps correctly.

This compatibility change should be confirmed with the Correlation team before being included in shared Correlation code.

### JSON NaN Handling

Some Correlation matrices can contain `NaN`.

`NaN` is not valid JSON for the Node backend.

For local testing, non-finite values were converted to JSON `null`.

This compatibility change should also be confirmed with the Correlation team.

## Anomaly Integration

The Anomaly service contract is still pending confirmation from the Models team.

The following details are still required:

- Anomaly service URL
- Detector/model to use
- Input payload
- Response structure
- Meaning of anomaly score
- Authentication requirements

The Anomaly integration should only be finalized after these details are confirmed.

## Current Status

### Complete

- Correlation service URL confirmed
- Correlation request payload confirmed
- Correlation response structure confirmed
- Pearson and Spearman methods confirmed
- Internal authentication requirement confirmed
- Persisted PostgreSQL data read implemented
- Correlation payload transformation implemented
- Correlation HTTP client implemented
- Timeout handling implemented
- Retry handling implemented
- Error handling implemented
- Public `/api/correlation-alert` route implemented
- Real Correlation service call completed
- Successful API proof captured
- Failure API proof captured

### Pending

- Correlation team confirmation of local timestamp compatibility fix
- Correlation team confirmation of JSON `NaN` compatibility fix
- Anomaly service contract
- Anomaly integration
