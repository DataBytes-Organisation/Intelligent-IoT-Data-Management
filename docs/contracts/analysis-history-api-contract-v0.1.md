# Analysis History API Contract

**Status:** Draft V0.1, waiting for agreement from Backend, Frontend and Intelligence
**Owner:** Engineering (Senior Lead Tommy Nguyen, Backend Junior Lead Megan Rui En Yong)
**Planner task:** ENG-02, Sprint 1 (Weeks 2 to 4)
**Builds on:** `docs/contracts/shared-analytics-alert-contract-v0.1.md`
**Unblocks:** BE-02 (history endpoints) and FE-01 (Analysis History page)
**Last updated:** 22 November 2026

## 1. Purpose

Users can run an analysis today, but the result disappears when they leave the dashboard. The T2 handover lists this as an open Backend issue: results and alerts are never stored.

This contract fixes the request and response JSON for three read endpoints, so Backend and Frontend can build at the same time against the same shape:

| ID | Method | Path | Purpose |
|---|---|---|---|
| HIST-01 | `GET` | `/api/analysis/runs/latest` | The newest stored run for the signed in user |
| HIST-02 | `GET` | `/api/analysis/runs` | A paged list of the user's past runs, newest first |
| HIST-03 | `GET` | `/api/analysis/runs/:runId` | One stored run with all of its alerts |

Mock responses for every case below are in `frontend/src/mocks/analysisHistory/`.

## 2. Design rules

1. **The stored result is the Analytics envelope, unchanged.** Each run keeps the exact Draft V0.1 envelope (`status`, `generated_at`, `alerts`, `summary`, `errors`) that `POST /api/analyse` returned. Frontend can pass `run.result` straight into the existing Analysis Summary and Active Alerts views, the same way the dashboard uses the live response today.
2. **Backend assigns `alert_id`.** The alert contract leaves `alert_id` as `null` and says Backend owns it. When a run is saved, Backend gives every alert a UUID. Active Alerts already uses `alert_id` as its list key.
3. **Two naming styles, one boundary.** Fields that Backend creates for a run use camelCase, like the dataset API (`datasetId`, `createdAt`). Everything inside `result` keeps the snake_case names from the alert contract. Nothing inside `result` is renamed.
4. **A user only sees their own runs.** Every endpoint needs a Bearer access token. A run that belongs to another user returns `404 RUN_NOT_FOUND`, not `403`, so the API does not reveal that the run exists.
5. **Runs survive dataset deletion.** The run stores `datasetName` at the time of the run. If the dataset is later deleted, the run still appears and `datasetDeleted` is `true`.
6. **All timestamps are ISO 8601 UTC strings.**

## 3. What gets saved (proposal for BE-02)

Sprint 1 saves a run only when `POST /api/analyse` gets a `200` response from Analytics with `status: "success"`. Validation failures and Analytics outages are not saved.

After saving, `POST /api/analyse` returns the same envelope as now with two additions, so Frontend can link straight to the saved run:

- a top level `run_id` (string, UUID)
- every alert has its `alert_id` filled in

Both additions are new fields only. No existing field changes name or type, so current consumers keep working. Intelligence must confirm they are happy with `run_id` sitting next to their envelope fields (see section 8).

## 4. Shared objects

### 4.1 Run summary

Used by the list endpoint (HIST-02) and at the top of the run detail.

```json
{
  "id": "6f1c2a4e-8b0d-4c57-9f3e-2d8a7b1e5c90",
  "datasetId": 42,
  "datasetName": "melbourne-weather-replay",
  "datasetDeleted": false,
  "status": "success",
  "streams": ["temperature", "humidity", "pressure"],
  "modelMetric": "temperature",
  "processedItems": 500,
  "alertCount": 3,
  "alertCountByType": { "POINTWISE_ANOMALY": 1, "CORRELATION_CHANGE": 2 },
  "highestSeverity": "HIGH",
  "generatedAt": "2026-11-21T09:14:58Z",
  "createdAt": "2026-11-21T09:15:02Z"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Run identifier, assigned by Backend |
| `datasetId` | integer or null | Dataset the run used; `null` when the run was sent as a direct `data` batch |
| `datasetName` | string or null | Dataset name saved at run time |
| `datasetDeleted` | boolean | `true` when the dataset has been deleted since the run |
| `status` | string | Copy of `result.status`; always `success` in Sprint 1 |
| `streams` | string array | `request.correlation.streams` |
| `modelMetric` | string | `request.model.metric` |
| `processedItems` | integer | Copy of `result.summary.processed_items` |
| `alertCount` | integer | Copy of `result.summary.alert_count` |
| `alertCountByType` | object | Number of alerts for each `alert_type`; a type with no alerts is `0` |
| `highestSeverity` | string or null | Highest of `HIGH`, `MEDIUM`, `LOW` across the alerts; `null` when no alert has a severity |
| `generatedAt` | string | Copy of `result.generated_at` (when Analytics produced the result) |
| `createdAt` | string | When Backend saved the run |

The list page needs date, dataset, streams and number of alerts. All four are in the summary, so the list page never has to load full results.

### 4.2 Run detail

Used by HIST-01 and HIST-03. It is the run summary plus `request`, `contractVersion` and `result`.

```json
{
  "id": "6f1c2a4e-8b0d-4c57-9f3e-2d8a7b1e5c90",
  "datasetId": 42,
  "datasetName": "melbourne-weather-replay",
  "datasetDeleted": false,
  "status": "success",
  "streams": ["temperature", "humidity", "pressure"],
  "modelMetric": "temperature",
  "processedItems": 500,
  "alertCount": 3,
  "alertCountByType": { "POINTWISE_ANOMALY": 1, "CORRELATION_CHANGE": 2 },
  "highestSeverity": "HIGH",
  "generatedAt": "2026-11-21T09:14:58Z",
  "createdAt": "2026-11-21T09:15:02Z",
  "contractVersion": "0.1",
  "request": {
    "model": { "detector": "isolationforest", "metric": "temperature", "parameters": {} },
    "correlation": { "streams": ["temperature", "humidity", "pressure"], "window_size": 20, "step_size": 10, "method": "pearson" }
  },
  "result": {
    "status": "success",
    "generated_at": "2026-11-21T09:14:58Z",
    "alerts": ["... Draft V0.1 alerts with alert_id filled ..."],
    "summary": { "processed_items": 500, "alert_count": 3 },
    "errors": []
  }
}
```

| Field | Type | Description |
|---|---|---|
| `contractVersion` | string | Alert contract version the result was saved under. Frontend uses it to read old runs safely after the contract reaches V1.0 |
| `request` | object | The `model` and `correlation` settings Backend sent to Analytics, after defaults were applied. Lets the user see and later repeat the exact run. Raw sensor rows are not stored here |
| `result` | object | The Analytics envelope exactly as returned, with `alert_id` filled in |

## 5. Endpoints

### 5.1 HIST-01 GET /api/analysis/runs/latest

| Field | Value |
|---|---|
| Purpose | Reopen the user's most recent result, for example when the dashboard loads |
| Authentication | Bearer access token |
| Query | `datasetId` (optional, positive integer): latest run for that dataset only |
| Ordering | Newest `createdAt`; ties broken by `id` so the answer is stable |

**`200 OK`**: a run detail (section 4.2). Mock: `run_latest.json`.

**`404 RUN_NOT_FOUND`**: the user has no runs yet, or none for that `datasetId`. Frontend shows the empty state ("Run an analysis to view the summary."), not an error. Mock: `run_latest_none.json`.

### 5.2 HIST-02 GET /api/analysis/runs

| Field | Value |
|---|---|
| Purpose | Fill the Analysis History page |
| Authentication | Bearer access token |
| Ordering | Newest `createdAt` first |

| Query parameter | Type | Default | Rule |
|---|---|---|---|
| `page` | integer | `1` | 1 or more |
| `pageSize` | integer | `20` | 1 to 100 |
| `datasetId` | integer | none | Optional filter |

**`200 OK`**. Mock: `runs_list_page1.json`.

```json
{
  "items": ["... run summaries (section 4.1) ..."],
  "page": 1,
  "pageSize": 20,
  "totalItems": 3,
  "totalPages": 1
}
```

- `items` is always a list. No runs means `"items": []`, `totalItems: 0`, `totalPages: 0`, still `200`. Mock: `runs_list_empty.json`.
- A `page` past the last page returns `200` with an empty `items` list.
- Bad `page`, `pageSize` or `datasetId` returns `400 VALIDATION_ERROR`. Mock: `error_validation.json`.

### 5.3 HIST-03 GET /api/analysis/runs/:runId

| Field | Value |
|---|---|
| Purpose | Open one past run from the history list |
| Authentication | Bearer access token |
| Path | `runId`: UUID of the run |

**`200 OK`**: a run detail (section 4.2). Mocks: `run_detail_with_alerts.json`, `run_detail_no_alerts.json`.

**`400 VALIDATION_ERROR`**: `runId` is not a UUID.
**`404 RUN_NOT_FOUND`**: no such run, or it belongs to another user. Mock: `error_run_not_found.json`.

## 6. Errors

The history endpoints use the same error shape that `POST /api/analyse` returns today, so the Frontend client handles both the same way:

```json
{
  "error": "Analysis run not found",
  "code": "RUN_NOT_FOUND"
}
```

| Scenario | Status | Code | Frontend behaviour |
|---|---|---|---|
| Missing or expired token | `401` | `UNAUTHENTICATED` | Refresh once, then end the session |
| Bad query or path value | `400` | `VALIDATION_ERROR` | Fix the request; no automatic retry |
| No run, or not the user's run | `404` | `RUN_NOT_FOUND` | Empty state for HIST-01; "This run is no longer available" for HIST-03 |
| Database unavailable | `503` | `SERVICE_UNAVAILABLE` | Keep the page, offer retry |
| Anything else | `500` | `INTERNAL_ERROR` | Generic retry state |

Note: `backend/docs/mvp/api-contract.md` section 5 describes a different, nested error envelope (`{"error": {"code", "message"}}`) that the live analysis route does not use. This contract follows the live route. Megan to decide whether Backend moves every route to the nested shape later; that would be a separate contract version.

## 7. Storage outline for BE-02 (not part of the contract)

The API shape above does not depend on how Backend stores runs, but this is the simplest layout that serves all three endpoints:

- `analysis_runs`: `id UUID`, `user_id UUID`, `dataset_id INTEGER` (references `datasets`, set to null on delete), `dataset_name TEXT`, `status TEXT`, `contract_version TEXT`, `request JSONB`, `result JSONB`, `generated_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`. Index on `(user_id, created_at DESC)`.
- `analysis_alerts`: `id UUID` (the `alert_id`), `run_id UUID` (cascade on delete), `alert_type TEXT`, `severity TEXT`, `alert_timestamp TIMESTAMPTZ`, `payload JSONB`. This table is what the later email notification task (high severity alerts) will query.

Tests BE-02 should include: saving a run and reading it back unchanged; `alert_id` filled for every alert; a second user gets `404` for the first user's run; paging returns newest first with correct totals.

## 8. Questions that need an answer before V1.0

**For Intelligence (Analytics Integration):**
1. Can Backend store the full envelope, including every `supporting_values` and `score_metadata` field, or are any fields temporary and not meant to be kept?
2. Is it fine for Backend to add `run_id` next to your envelope fields in the `POST /api/analyse` response, and to fill `alert_id`?
3. Will `generated_at` stay the time Analytics produced the result? We copy it into `generatedAt`.
4. When the alert contract moves to V1.0, will old V0.1 results still be valid to display? We store `contractVersion` either way.

**For Backend (Megan):**
5. Save only successful runs in Sprint 1 (this draft), or also save runs that Analytics rejected?
6. Keep the flat error shape (section 6) for now?

**For Frontend (Lorenzo):**
7. Does the run summary have everything the history list needs, without loading the full result?
8. Is `404 RUN_NOT_FOUND` on HIST-01 easy to treat as an empty state, or would you rather get `200` with `null`?

## 9. Change process

Same as the alert contract: agree changes with the affected teams, record them here, update the mocks in the same pull request, and raise the version when a change would break a consumer.
