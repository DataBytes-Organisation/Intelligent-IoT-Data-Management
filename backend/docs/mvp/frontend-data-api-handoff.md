# Frontend Data API Handoff

## Purpose

This document describes the frontend work required to consume the published V1 Data API examples.

The example payloads are provided in:

- `backend/docs/mvp/evidence/api-samples.json`
- `backend/docs/mvp/evidence/alerts-history.json`

## Current Frontend Status

The current frontend dashboard still loads local mock sensor data through `useSensorData(true)`.

The frontend does not yet have a dedicated data API client or response adapter for the V1 Data API response envelope.

## Required Frontend Work

The frontend should add a data API client or adapter that can consume the documented V1 response shapes.

Expected adapter responsibilities:

- read dataset list responses from `data.datasets`
- read series rows from `data.series`
- read filtered rows from `data.series`
- read analytics output from `data.analysis`
- read latest alerts from `data.alerts`
- read alert history from `data.alerts` and `data.pagination`
- handle standard V1 error responses from `error.code`, `error.message`, and `error.fields`

## Suggested Frontend Files

Likely files to update or add:

| File | Reason |
|---|---|
| `new-frontend/frontend/src/services/dataApiClient.js` | Add data API request helpers and response adapters |
| `new-frontend/frontend/src/hooks/useSensorData.js` | Replace direct mock/raw fetch handling with adapter-based data loading |
| `new-frontend/frontend/src/pages/HomePage.jsx` | Later replace hardcoded dataset cards with dataset API data |
| `new-frontend/frontend/src/components/Dashboard.jsx` | Later pass selected dataset name/id into the data hook |

## Adapter Contract

The frontend adapter should expose UI-ready values and hide envelope differences from components.

Example expected outputs:

| Adapter function | Output expected by UI |
|---|---|
| `normalizeDatasetsResponse(response)` | array of dataset objects |
| `normalizeSeriesResponse(response)` | array of series rows |
| `normalizeFilterResponse(response)` | array of filtered series rows |
| `normalizeAnalyticsResponse(response)` | analytics summary object |
| `normalizeAlertsResponse(response)` | array of alert objects |
| `normalizeAlertHistoryResponse(response)` | `{ alerts, pagination }` |

## Transitional Notes

The current backend may still return raw arrays for some data routes.

Frontend adapters may temporarily support both:

1. V1 envelope responses documented in the contract.
2. Current transitional raw backend responses.

The V1 contract remains the target integration shape.

## Completion Criteria For Frontend

Frontend confirmation should include:

- documented examples load successfully
- empty responses do not break the UI
- validation/auth/upstream errors can be displayed consistently
- dashboard no longer depends on mock-only assumptions
- adapter supports V1 envelope response shapes