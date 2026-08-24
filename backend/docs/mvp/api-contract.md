# AFIR-02 Frontend / Backend API Cross-Reference

## Purpose

This document cross-references the frontend dashboard data requirements identified during AFIR-02 with the backend API routes currently available in the project.

This is an audit document only. No API contracts or implementation code were changed.

## API Cross-Reference

| Backend Route | Method | Frontend Use / Candidate | Current Status |
|---|---|---|---|
| `/api/datasets` | GET | Dataset discovery/listing | Available |
| `/api/datasets/:id` | GET | Dataset metadata lookup | Available |
| `/api/datasets/:name/series` | GET | Primary candidate for dashboard sensor/time-series data | Available, not currently wired to Dashboard |
| `/api/datasets/:name/series/filter` | POST | Selected metric/stream filtering | Available, not currently wired to Dashboard |
| `/api/datasets/:name/timestamps` | GET | Time-range/timestamp support | Available, not currently wired to Dashboard |
| `/api/streams` | GET | Existing endpoint referenced by `useSensorData` when mock mode is disabled | Existing mock-oriented path; not the preferred dataset-aware integration route |
| `/api/stream-names` | GET | Available stream discovery | Existing mock-oriented path |
| `/api/filter-streams` | POST | Stream filtering | Existing mock-oriented path |
| `/api/data-profile` | GET | Potential statistics/profile support | Existing mock-oriented path |
| `/api/top-correlated-pair` | POST | Potential correlation support | Existing mock-oriented path |
| `/api/analyse` | POST | Generic analysis | Placeholder implementation only |

## Primary Dashboard Data Contract

The current frontend dashboard expects time-series rows broadly shaped as:

```json
{
  "created_at": "timestamp",
  "entry_id": 1,
  "metricName": 123.45
}
```

Additional metric fields are discovered dynamically by the frontend.

The dataset-aware backend series service also produces wide-format entries containing:

- `created_at`
- `entry_id`
- dynamic metric fields

Therefore:

`GET /api/datasets/:name/series`

is the strongest existing backend candidate for future live dashboard integration.

## Frontend Current Data Path

The active Dashboard currently uses:

`useSensorData(true)`

Mock mode loads:

`src/data/sensorData1.json`

The same hook defines `/api/streams` as its default API endpoint when mock mode is disabled.

However, the current backend architecture also provides dataset-aware APIs under:

`/api/datasets/:name/...`

These routes are better aligned with the application's dataset-specific dashboard route:

`/dashboard/:id`

## Dataset Series

### GET `/api/datasets/:name/series`

Purpose:

Returns wide-format time-series entries for the requested dataset.

Potential frontend consumers:

- Main dashboard dataset
- Stream discovery
- Stream statistics
- Scatter plots
- Correlation calculations
- Line charts
- Frontend time filtering

Integration status:

**Available but not currently connected to the active Dashboard.**

## Dataset Series Filtering

### POST `/api/datasets/:name/series/filter`

Expected request body:

```json
{
  "streamNames": ["field1", "field2"]
}
```

Purpose:

Returns dataset entries restricted to selected metric names.

Integration status:

**Available but not currently connected to the frontend stream-selection flow.**

The frontend currently performs additional filtering locally, including time range, entry ID range and interval sampling.

## Dataset Timestamps

### GET `/api/datasets/:name/timestamps`

Purpose:

Returns the timestamps associated with a dataset.

Potential frontend consumer:

`useTimeRange`

Integration status:

**Available but not currently connected.**

## Mock-Oriented Routes

The following routes belong to the existing mock/processed-data flow:

- `GET /api/streams`
- `GET /api/stream-names`
- `POST /api/filter-streams`
- `GET /api/data-profile`
- `POST /api/top-correlated-pair`

These provide functionality similar to several frontend operations, but they are not currently dataset-aware replacements for the database-backed dashboard flow.

## Analysis

### POST `/api/analyse`

The route exists, but the current service implementation only returns the submitted payload with a placeholder completion message.

Therefore, it should not currently be treated as a production analysis API.

## AFIR-02 Conclusion

The frontend and backend already have a broadly compatible wide-format time-series contract.

The primary issue is not the absence of a backend series API. The main integration gap is that the active Dashboard remains configured to load mock data and does not currently use the selected dataset to request the corresponding dataset-aware backend series.

Future implementation should be handled separately from this audit.
---

# AFI-07 Frontend-Ready Response Standards

## Purpose

This section defines the recommended response structures for the backend APIs so that frontend components receive consistent JSON payloads. These standards are intended to support future frontend and backend integration and reduce inconsistencies across API endpoints.

---

## Standard Response Format

Every successful API response should follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

Every failed API response should follow this structure:

```json
{
  "success": false,
  "error": {
    "code": 500,
    "message": "Failed to load resource"
  }
}
```

---

## Series Response

Route:

GET `/api/datasets/:name/series`

Recommended response:

```json
{
  "success": true,
  "data": [
    {
      "created_at": "2026-07-30T10:00:00Z",
      "entry_id": 1,
      "field1": 25.4,
      "field2": 60.2
    }
  ],
  "message": "Series data loaded successfully"
}
```

---

## Analytics Response

Route:

POST `/api/analyse`

Recommended response:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "highestCorrelation": {
        "stream1": "field1",
        "stream2": "field2",
        "score": 0.94
      }
    }
  },
  "message": "Analysis completed successfully"
}
```

---

## Alert Response

Recommended response:

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "severity": "High",
        "message": "Temperature exceeded threshold",
        "created_at": "2026-07-30T10:00:00Z"
      }
    ]
  },
  "message": "Alerts loaded successfully"
}
```

---

## Error Response

Recommended response:

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Requested resource was not found"
  }
}
```

---

## Response Standard Notes

The recommended response format provides a consistent structure for successful and failed requests. Returning a standard JSON object containing success, data, message and error fields allows frontend components to process responses uniformly without implementing route-specific parsing logic.

These standards are proposed for future implementation and do not modify the current backend behaviour observed during the AFIR-02 audit.
