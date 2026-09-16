# Data API Contract

This document defines the MVP dataset, time-series, filter, analytics, and alert API contract. It extends the authentication and operations baseline in `api-contract.md`.

## 1. Contract metadata

| Field | Value |
| --- | --- |
| Contract version | `v1.0.0-data` |
| Status | Draft - frontend-ready data examples in progress |
| API base URL | Local: `http://localhost:3000/api`; deployed: `VITE_API_BASE_URL` ending in `/api` |
| Related tickets | `AFI-12`, `AFI-14`, `BDAI-10`, `BDAI-11` |
| Source baseline | `backend/docs/mvp/api-contract.md` |

## 2. Contract rules

- This contract covers frontend-consumed data, analytics, and alert endpoints only.
- Authentication and session rules are inherited from `api-contract.md`.
- All successful V1 responses should use the standard envelope `{ "data": ..., "meta": ... }`.
- Current implemented backend data endpoints may still return transitional raw arrays. Frontend adapters must support both V1 envelopes and transitional raw responses until backend cutover is complete.
- Timestamps must be ISO-8601 UTC strings in V1 responses.
- Numeric sensor readings must be JSON numbers or `null`, not numeric strings.
- Frontend code must consume these response shapes through API clients/adapters, not manual mock assumptions.
- Analytics success payloads require BDAI-10 completion.
- Alert latest/history success payloads require BDAI-11 completion.
- Every documented error must include a stable machine-readable `error.code`.

## 3. Route inventory

| ID | Method | Path | Purpose | Auth | Consumer | Status |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-01 | `GET` | `/api/datasets` | List available datasets | None | FE dashboard/home | Implemented - transitional response |
| DATA-02 | `GET` | `/api/datasets/:name/series` | Return time-series rows for a dataset | None | FE dashboard charts | Implemented - transitional response |
| DATA-03 | `POST` | `/api/datasets/:name/series/filter` | Return selected streams for a dataset | None | FE stream selector/charts | Implemented - transitional response |
| ANALYTICS-01 | `POST` | `/api/analyse` | Run analytics for selected dataset/streams | Bearer token planned | FE analysis cards | Pending BDAI-10 |
| ALERT-01 | `GET` | `/api/alerts/latest` | Return latest generated alerts | Bearer token planned | FE alert summary | Pending BDAI-11 |
| ALERT-02 | `GET` | `/api/alerts/history` | Return paginated alert history | Bearer token planned | FE alert history view | Pending BDAI-11 |

## 4. Data and naming rules

| Field / concept | Rule | Example |
| --- | --- | --- |
| Dataset name | Stable dataset slug used in URL path. | `thingspeak-live` |
| Display name | Human-readable dataset label for UI. May match dataset name until display metadata exists. | `ThingSpeak Live` |
| Timestamp | Use `created_at` in API payloads. V1 target is ISO-8601 UTC. | `2026-08-05T01:02:03.000Z` |
| Entry identifier | Use `entry_id` to identify source row/order inside a dataset. | `3242057` |
| Stream key | Current backend returns ThingSpeak-style `field1` to `field8`. V1 adapters may map these to display labels. | `field3` |
| Numeric reading | JSON number or `null`. Transitional responses may contain numeric strings from source data; adapters must normalize them. | `22.4` |
| Empty result | Return a valid response shape with an empty array when the request is valid but no rows match. | `{ "data": { "rows": [] } }` |
| Unknown dataset | Return `404` with `DATASET_NOT_FOUND` in V1. Current backend may return `{ "error": "Dataset not found or empty" }`. | `DATASET_NOT_FOUND` |

## 5. Standard response and error contract

### V1 success envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01"
  }
}
```

### Transitional success responses

Some implemented data endpoints currently return raw JSON arrays instead of the V1 envelope.

Example:

```json
[
  {
    "id": 1,
    "name": "thingspeak-live"
  }
]
```

Frontend adapters must support transitional raw responses and normalize them into V1-style objects before UI consumption.

### V1 error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": {
      "streamNames": "streamNames must be a non-empty array."
    }
  },
  "meta": {
    "requestId": "req_01"
  }
}
```

### Error scenarios

| Scenario | HTTP status | V1 code | Current backend note | Frontend behaviour |
| --- | --- | --- | --- | --- |
| Invalid request body | `400` | `VALIDATION_ERROR` | Current filter route returns `{ "error": "streamNames must be a non-empty array" }`. | Show input guidance; do not retry automatically. |
| Dataset not found or empty | `404` | `DATASET_NOT_FOUND` | Current series route returns `{ "error": "Dataset not found or empty" }`. | Show empty/missing dataset state. |
| Missing or invalid token | `401` | `UNAUTHENTICATED` | Protected routes may return legacy auth error shapes until auth cutover. | Attempt refresh once when supported; otherwise redirect to login. |
| Analytics not implemented | `501` | `ANALYTICS_NOT_IMPLEMENTED` | Current `/api/analyse` returns placeholder success. | Show analytics unavailable state. |
| Alert persistence not implemented | `501` | `ALERTS_NOT_IMPLEMENTED` | No active alerts route exists yet. | Hide alert history or show pending state. |
| Upstream ThingSpeak unavailable | `503` | `UPSTREAM_SERVICE_UNAVAILABLE` | Poller logs failure; route-level failure shape still needs BE implementation. | Preserve current view and offer retry. |
| Unexpected server failure | `500` | `INTERNAL_ERROR` | Current routes may return plain `{ "error": "..." }`. | Show generic retry state. |

## 6. Endpoint specification

### 6.1 DATA-01 - GET /api/datasets

| Field | Value |
| --- | --- |
| Status | Implemented - transitional response |
| Purpose | Return available dataset metadata for frontend dataset selection. |
| Consumers | Home page dataset list, dashboard dataset selector, API client |
| Source of truth | PostgreSQL `datasets` table |
| Authentication | None for MVP data demo |
| Rate limit / timeout | No explicit rate limit; 10-second frontend timeout recommended |

#### Request

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Query | `limit` | integer | No | Future pagination; not currently implemented | `20` |
| Query | `offset` | integer | No | Future pagination; not currently implemented | `0` |

#### Request example

```http
GET /api/datasets
```

#### V1 success response

HTTP status: `200 OK`

```json
{
  "data": {
    "datasets": [
      {
        "id": 1,
        "name": "thingspeak-live",
        "displayName": "ThingSpeak Live"
      }
    ]
  },
  "meta": {
    "requestId": "req_data_01"
  }
}
```

#### Current transitional success response

```json
[
  {
    "id": 1,
    "name": "thingspeak-live"
  }
]
```

#### Empty, validation, and failure cases

| Scenario | HTTP status | Response example | Frontend behaviour |
| --- | --- | --- | --- |
| No datasets exist | `200` | `{ "data": { "datasets": [] }, "meta": { "requestId": "req_data_empty" } }` | Show empty dataset library state. |
| Database unavailable | `503` | `SERVICE_UNAVAILABLE` | Show retry state. |
| Unexpected failure | `500` | `INTERNAL_ERROR` | Show generic retry state. |

### 6.2 DATA-02 - GET /api/datasets/:name/series

| Field | Value |
| --- | --- |
| Status | Implemented - transitional response |
| Purpose | Return time-series rows for a dataset. |
| Consumers | Dashboard charts, stream discovery, time range controls |
| Source of truth | PostgreSQL `timeseries` and `timeseries_long` tables |
| Authentication | None for MVP data demo |
| Rate limit / timeout | No explicit rate limit; 10-second frontend timeout recommended |

#### Request

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Path | `name` | string | Yes | Dataset slug | `thingspeak-live` |
| Query | `limit` | integer | No | Future pagination/windowing; not currently implemented | `100` |
| Query | `from` | string | No | Future ISO-8601 lower time bound | `2026-08-05T00:00:00.000Z` |
| Query | `to` | string | No | Future ISO-8601 upper time bound | `2026-08-05T01:00:00.000Z` |

#### Request example

```http
GET /api/datasets/thingspeak-live/series
```

#### V1 success response

HTTP status: `200 OK`

```json
{
  "data": {
    "dataset": "thingspeak-live",
    "rowCount": 2,
    "rows": [
      {
        "dataset_id": 1,
        "created_at": "2026-08-05T01:02:03.000Z",
        "entry_id": 3242057,
        "field1": 6,
        "field2": 4,
        "field3": 2.4,
        "field4": 3,
        "field5": 10,
        "field6": 10,
        "field7": 10,
        "field8": 10
      },
      {
        "dataset_id": 1,
        "created_at": "2026-08-05T01:02:19.000Z",
        "entry_id": 3242058,
        "field1": 6,
        "field2": 7,
        "field3": 4.2,
        "field4": 6,
        "field5": 3,
        "field6": 3,
        "field7": 3,
        "field8": 3
      }
    ]
  },
  "meta": {
    "requestId": "req_series_01"
  }
}
```

#### Current transitional success response

```json
[
  {
    "dataset_id": 1,
    "created_at": "2026-08-05T01:02:03.000Z",
    "entry_id": 3242057,
    "field1": 6,
    "field2": 4,
    "field3": 2.4,
    "field4": 3,
    "field5": 10,
    "field6": 10,
    "field7": 10,
    "field8": 10
  }
]
```

#### Empty, validation, and failure cases

| Scenario | HTTP status | Response example | Frontend behaviour |
| --- | --- | --- | --- |
| Dataset exists but has no rows | `200` | `{ "data": { "dataset": "thingspeak-live", "rowCount": 0, "rows": [] }, "meta": { "requestId": "req_series_empty" } }` | Show empty chart state. |
| Unknown dataset | `404` | `DATASET_NOT_FOUND` | Show missing dataset state and return to dataset list. |
| Database unavailable | `503` | `SERVICE_UNAVAILABLE` | Preserve current dashboard state and offer retry. |
| Unexpected failure | `500` | `INTERNAL_ERROR` | Show generic retry state. |

### 6.3 DATA-03 - POST /api/datasets/:name/series/filter

| Field | Value |
| --- | --- |
| Status | Implemented - transitional response |
| Purpose | Return time-series rows containing only selected stream keys plus row identity fields. |
| Consumers | Stream selector, dashboard charts, correlation views |
| Source of truth | PostgreSQL `timeseries` and `timeseries_long` tables |
| Authentication | None for MVP data demo |
| Rate limit / timeout | No explicit rate limit; 10-second frontend timeout recommended |

#### Request

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Path | `name` | string | Yes | Dataset slug | `thingspeak-live` |
| Body | `streamNames` | array<string> | Yes | Non-empty list of stream keys | `[ "field3", "field4", "field6" ]` |

#### Request example

```http
POST /api/datasets/thingspeak-live/series/filter
Content-Type: application/json

{
  "streamNames": ["field3", "field4", "field6"]
}
```

#### V1 success response

HTTP status: `200 OK`

```json
{
  "data": {
    "dataset": "thingspeak-live",
    "streamNames": ["field3", "field4", "field6"],
    "rowCount": 2,
    "rows": [
      {
        "created_at": "2026-08-05T01:02:03.000Z",
        "entry_id": 3242057,
        "field3": 2.4,
        "field4": 3,
        "field6": 10
      },
      {
        "created_at": "2026-08-05T01:02:19.000Z",
        "entry_id": 3242058,
        "field3": 4.2,
        "field4": 6,
        "field6": 3
      }
    ]
  },
  "meta": {
    "requestId": "req_filter_01"
  }
}
```

#### Current transitional success response

```json
[
  {
    "created_at": "2026-08-05T01:02:03.000Z",
    "entry_id": 3242057,
    "field3": 2.4,
    "field4": 3,
    "field6": 10
  }
]
```

#### Empty, validation, and failure cases

| Scenario | HTTP status | Response example | Frontend behaviour |
| --- | --- | --- | --- |
| Empty `streamNames` | `400` | `VALIDATION_ERROR` | Show stream selection guidance. |
| Unknown dataset | `404` | `DATASET_NOT_FOUND` | Show missing dataset state. |
| Valid request but no rows | `200` | `{ "data": { "dataset": "thingspeak-live", "streamNames": ["field3"], "rowCount": 0, "rows": [] }, "meta": { "requestId": "req_filter_empty" } }` | Show empty chart state. |
| Database unavailable | `503` | `SERVICE_UNAVAILABLE` | Preserve current selections and offer retry. |
| Unexpected failure | `500` | `INTERNAL_ERROR` | Show generic retry state. |

### 6.4 ANALYTICS-01 - POST /api/analyse

| Field | Value |
| --- | --- |
| Status | Pending BDAI-10 |
| Purpose | Run analytics for selected dataset and stream names. |
| Consumers | Dashboard analysis cards, correlation summary, future anomaly insights |
| Source of truth | Backend analytics orchestration over persisted dataset rows |
| Authentication | Bearer token planned after auth cutover |
| Rate limit / timeout | 30-second frontend timeout recommended |

#### Request

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Body | `datasetName` | string | Yes | Dataset slug | `thingspeak-live` |
| Body | `streamNames` | array<string> | Yes | At least two streams for correlation analytics | `[ "field3", "field4", "field6" ]` |
| Body | `windowSize` | integer | No | Positive integer; analytics implementation will define default | `20` |
| Body | `method` | string | No | Supported values depend on analytics implementation | `pearson` |

#### Request example

```http
POST /api/analyse
Content-Type: application/json

{
  "datasetName": "thingspeak-live",
  "streamNames": ["field3", "field4", "field6"],
  "windowSize": 20,
  "method": "pearson"
}
```

#### V1 success response target

HTTP status: `200 OK`

```json
{
  "data": {
    "dataset": "thingspeak-live",
    "streamNames": ["field3", "field4", "field6"],
    "summary": {
      "rowCount": 289,
      "windows": 14,
      "alerts": 0
    },
    "correlations": [],
    "insights": []
  },
  "meta": {
    "requestId": "req_analyse_01",
    "status": "pending-bdai-10"
  }
}
```

#### Current backend response

Current `/api/analyse` returns placeholder output only and must not be treated as completed analytics.

```json
{
  "received": {
    "datasetName": "thingspeak-live",
    "streamNames": ["field3", "field4", "field6"]
  },
  "message": "Analysis completed (placeholder)"
}
```

#### Empty, validation, and failure cases

| Scenario | HTTP status | Response example | Frontend behaviour |
| --- | --- | --- | --- |
| Analytics not implemented | `501` | `ANALYTICS_NOT_IMPLEMENTED` | Show analytics unavailable state. |
| Invalid stream list | `400` | `VALIDATION_ERROR` | Show stream selection guidance. |
| Unknown dataset | `404` | `DATASET_NOT_FOUND` | Show missing dataset state. |
| Analytics service unavailable | `503` | `SERVICE_UNAVAILABLE` | Preserve selections and offer retry. |
| Unexpected failure | `500` | `INTERNAL_ERROR` | Show generic retry state. |

### 6.5 ALERT-01 - GET /api/alerts/latest

| Field | Value |
| --- | --- |
| Status | Pending BDAI-11 |
| Purpose | Return the most recent generated alerts for dashboard summary display. |
| Consumers | Dashboard alert summary card |
| Source of truth | Future alert persistence table/store |
| Authentication | Bearer token planned after auth cutover |
| Rate limit / timeout | 10-second frontend timeout recommended |

#### Request

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Query | `datasetName` | string | No | Dataset slug filter | `thingspeak-live` |
| Query | `limit` | integer | No | 1-50; default 5 | `5` |

#### Request example

```http
GET /api/alerts/latest?datasetName=thingspeak-live&limit=5
```

#### V1 success response target

HTTP status: `200 OK`

```json
{
  "data": {
    "alerts": []
  },
  "meta": {
    "requestId": "req_alert_latest_01",
    "status": "pending-bdai-11"
  }
}
```

#### Future persisted alert item shape

```json
{
  "id": "alert_001",
  "dataset": "thingspeak-live",
  "level": "HIGH",
  "type": "CORRELATION_CHANGE",
  "message": "Significant correlation drop detected.",
  "streamPair": ["field3", "field4"],
  "created_at": "2026-08-05T01:02:03.000Z",
  "details": {
    "previous_corr": 0.91,
    "current_corr": 0.24,
    "delta": 0.67,
    "window_index": 5
  }
}
```

#### Empty, validation, and failure cases

| Scenario | HTTP status | Response example | Frontend behaviour |
| --- | --- | --- | --- |
| No latest alerts | `200` | `{ "data": { "alerts": [] }, "meta": { "requestId": "req_alert_latest_empty" } }` | Show no-alerts state. |
| Alerts not implemented | `501` | `ALERTS_NOT_IMPLEMENTED` | Hide alert summary or show pending state. |
| Invalid query | `400` | `VALIDATION_ERROR` | Show filter guidance. |
| Unauthenticated | `401` | `UNAUTHENTICATED` | Follow auth contract session handling. |
| Alert store unavailable | `503` | `SERVICE_UNAVAILABLE` | Preserve dashboard and offer retry. |

### 6.6 ALERT-02 - GET /api/alerts/history

| Field | Value |
| --- | --- |
| Status | Pending BDAI-11 |
| Purpose | Return paginated alert history for review and audit. |
| Consumers | Alert history view, future alert drawer/table |
| Source of truth | Future alert persistence table/store |
| Authentication | Bearer token planned after auth cutover |
| Rate limit / timeout | 10-second frontend timeout recommended |

#### Request

| Location | Name | Type | Required | Rules | Example |
| --- | --- | --- | --- | --- | --- |
| Query | `datasetName` | string | No | Dataset slug filter | `thingspeak-live` |
| Query | `level` | string | No | `LOW`, `MEDIUM`, `HIGH` | `HIGH` |
| Query | `from` | string | No | ISO-8601 lower time bound | `2026-08-05T00:00:00.000Z` |
| Query | `to` | string | No | ISO-8601 upper time bound | `2026-08-05T02:00:00.000Z` |
| Query | `limit` | integer | No | 1-100; default 20 | `20` |
| Query | `offset` | integer | No | 0 or greater; default 0 | `0` |

#### Request example

```http
GET /api/alerts/history?datasetName=thingspeak-live&limit=20&offset=0
```

#### V1 success response target

HTTP status: `200 OK`

```json
{
  "data": {
    "alerts": [],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 0
    }
  },
  "meta": {
    "requestId": "req_alert_history_01",
    "status": "pending-bdai-11"
  }
}
```

#### Empty, validation, and failure cases

| Scenario | HTTP status | Response example | Frontend behaviour |
| --- | --- | --- | --- |
| No alerts match filters | `200` | `{ "data": { "alerts": [], "pagination": { "limit": 20, "offset": 0, "total": 0 } }, "meta": { "requestId": "req_alert_history_empty" } }` | Show empty alert history state. |
| Alerts not implemented | `501` | `ALERTS_NOT_IMPLEMENTED` | Hide alert history or show pending state. |
| Invalid pagination/filter | `400` | `VALIDATION_ERROR` | Show filter guidance. |
| Unauthenticated | `401` | `UNAUTHENTICATED` | Follow auth contract session handling. |
| Alert store unavailable | `503` | `SERVICE_UNAVAILABLE` | Preserve filters and offer retry. |

## 7. Data, analytics, and alert flows

| Flow | Route | Request fields | Success fields | Frontend behaviour | Status |
| --- | --- | --- | --- | --- | --- |
| Dataset discovery | `GET /api/datasets` | None | datasets | Render dataset library or selector. | Implemented - transitional |
| Series load | `GET /api/datasets/:name/series` | dataset name | dataset, rowCount, rows | Render dashboard charts and derive stream names. | Implemented - transitional |
| Stream filter | `POST /api/datasets/:name/series/filter` | dataset name, streamNames | dataset, streamNames, rowCount, rows | Render selected streams and statistics. | Implemented - transitional |
| Analytics run | `POST /api/analyse` | datasetName, streamNames, windowSize, method | summary, correlations, insights | Render analysis cards when BDAI-10 is complete. | Pending BDAI-10 |
| Latest alerts | `GET /api/alerts/latest` | optional datasetName, limit | alerts | Render latest alert summary when BDAI-11 is complete. | Pending BDAI-11 |
| Alert history | `GET /api/alerts/history` | filters, pagination | alerts, pagination | Render alert history table when BDAI-11 is complete. | Pending BDAI-11 |

### Frontend adapter rules

- Adapters must normalize current raw array responses into V1-style objects.
- Adapters must convert numeric strings to numbers where safe.
- Adapters must preserve `created_at`, `entry_id`, and selected stream keys.
- Adapters must expose empty arrays for empty states rather than `null`.
- Adapters must not assume local mock JSON when an API response is available.
- Adapters must treat pending analytics and alert routes as unavailable until backend implementation evidence exists.

## 8. Mock, transitional, and deprecated routes

| Route | Current purpose | Replacement stable route | Cutover condition | Owner / target date |
| --- | --- | --- | --- | --- |
| `/api/streams` | Legacy/mock stream data endpoint | `GET /api/datasets/:name/series` | Dashboard uses dataset-specific persisted series API. | FE + BE / target date to be confirmed |
| `/api/stream-names` | Legacy/mock stream-name discovery | Derive from `GET /api/datasets/:name/series` or future dataset metadata route | Stream metadata contract is approved. | FE + BE / target date to be confirmed |
| `/api/filter-streams` | Legacy/mock filtering endpoint | `POST /api/datasets/:name/series/filter` | Dashboard uses dataset-specific persisted filter API. | FE + BE / target date to be confirmed |
| Raw array dataset/series responses | Transitional implemented backend response shape | V1 `{ data, meta }` envelope | Backend response envelope cutover is implemented and FE adapters are verified. | BE / target date to be confirmed |
| `/api/analyse` placeholder response | Placeholder analytics echo | `POST /api/analyse` V1 analytics payload | BDAI-10 analytics orchestration is complete. | BE + BDAI / target date to be confirmed |
| Missing `/api/alerts/latest` | No active route | `GET /api/alerts/latest` | BDAI-11 alert persistence and latest alert route are complete. | BE + BDAI / target date to be confirmed |
| Missing `/api/alerts/history` | No active route | `GET /api/alerts/history` | BDAI-11 alert persistence and history route are complete. | BE + BDAI / target date to be confirmed |