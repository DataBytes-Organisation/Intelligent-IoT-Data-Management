# AFIR-02 Frontend Mock Dependency Audit

## Purpose

This document records the current frontend dashboard dependencies and identifies where mock data is currently used, which existing backend routes could support future live integration, and which gaps currently prevent direct replacement.

This is an audit only. No frontend or backend implementation changes are included in AFIR-02.

## Current Dashboard Data Source

The active dashboard is routed through:

`/dashboard/:id`

`DashboardPage.jsx` passes the selected dataset ID to the Dashboard component.

However, the Dashboard currently loads sensor data using:

`useSensorData(true)`

The `true` flag enables mock mode. In this mode, `useSensorData.js` loads:

`src/data/sensorData1.json`

instead of requesting data from the backend.

Therefore, the current dashboard remains dependent on mock sensor data regardless of the selected dashboard dataset.

## Widget Dependency Mapping

| Dashboard Area | Current Dependency | Existing Backend Candidate | Readiness | Current Gap / Blocker |
|---|---|---|---|---|
| Main dashboard dataset | `sensorData1.json` through `useSensorData(true)` | `GET /api/datasets/:name/series` | Partially replaceable | Dashboard is explicitly configured for mock mode and does not currently use the selected dataset to request live series data |
| Available streams | Stream names derived locally by `useStreamNames(data)` | Dataset series data / available metrics support | Partially replaceable | Stream list is currently derived from mock-loaded rows |
| Time range | `useTimeRange(data)` extracts `created_at` locally | `GET /api/datasets/:name/timestamps` | Replaceable candidate | Timestamp API exists but is not connected to the dashboard |
| Time and entry filtering | `useFilteredData()` filters mock-loaded rows locally | `POST /api/datasets/:name/series/filter` for metric filtering | Partially replaceable | Existing backend filter supports metric selection, while time range, entry ID and interval sampling are currently frontend-side operations |
| Stream statistics | `StreamStats.jsx` calculates min, max, average and count locally | Existing data-profile functionality | Partially replaceable | Current widget calculates statistics from frontend data rather than requesting backend profile results |
| Correlation analysis | Frontend correlation utilities operate on filtered data | `POST /api/top-correlated-pair` | Partially replaceable | Existing correlation route belongs to the mock-data service and is not dataset-aware |
| Most correlated pair | `MostCorrelatedPair.jsx` calculates the pair locally | `POST /api/top-correlated-pair` | Partially replaceable | Backend candidate exists but currently operates on mock/processed data rather than a selected database dataset |
| Scatter plot | `ScatterPlot.jsx` consumes filtered frontend data | `GET /api/datasets/:name/series` | Partially replaceable | Visualization can consume live wide-format rows, but live dataset data is not currently wired into Dashboard |
| Line chart | `Chart.jsx` consumes filtered frontend data | `GET /api/datasets/:name/series` | Partially replaceable | Chart itself is data-source independent, but its current input originates from the mock dataset |
| Generic analysis | Frontend analysis functionality | `POST /api/analyse` | Blocked for real analysis | Backend analyse service is currently a placeholder that echoes the submitted payload |

## Key Findings

1. The active Dashboard is currently mock-dependent at its primary data-loading point.

2. `DashboardPage` identifies a selected dataset through the route, but the Dashboard does not currently use that selection to retrieve the corresponding live time-series dataset.

3. Most dashboard widgets are not inherently tied to mock data. They operate on data passed into them and could potentially consume compatible live wide-format rows.

4. The backend already provides a dataset-aware series endpoint:

   `GET /api/datasets/:name/series`

   This endpoint is the strongest candidate for future replacement of the dashboard's primary mock dataset.

5. The backend series service produces wide-format records containing:

   - `created_at`
   - `entry_id`
   - dynamic metric fields

   This structure closely matches the format expected by the current frontend hooks and visualisation components.

6. A dataset timestamp endpoint also exists:

   `GET /api/datasets/:name/timestamps`

   This could support future time-range integration.

7. Some existing routes such as `/api/streams`, `/api/data-profile`, and `/api/top-correlated-pair` remain tied to the existing mock/processed-data path and should not automatically be treated as production dataset-aware replacements.

8. `POST /api/analyse` is currently a placeholder and does not provide real statistical or ML analysis.

## AFIR-02 Classification

Current frontend state: **Mock-dependent**

Live integration potential: **Partially replaceable using existing backend capabilities**

Primary integration gap: **The active dashboard is not wired to dataset-aware backend APIs**

## Scope Decision

AFIR-02 documents the current dependency state only.

No mock dependencies were removed and no frontend/backend implementation was modified as part of this audit. Follow-up integration work should be handled through separate implementation tasks.

# AFI-07 Response Standards Progress

## Objective

Define consistent frontend-ready API response structures for the core backend endpoints so the frontend can consume predictable payloads during future integration.

## Progress

- Reviewed the existing backend API routes documented during AFIR-02.
- Defined standard response examples for series, analytics, alerts, and error responses.
- Added representative payloads in `backend/docs/mvp/evidence/api-samples.json`.
- Proposed a consistent response structure using:
  - `success`
  - `data`
  - `message`
  - `error`
- Confirmed that the proposed structures support frontend integration without requiring changes to the current mock-data implementation.

## Deliverables

- Updated `backend/docs/mvp/api-contract.md`
- Created `backend/docs/mvp/evidence/api-samples.json`
- Updated `backend/docs/mvp/mvp-tracker.md`

## Status

Task completed and ready for review.