# MVP End-to-End Test Plan

## Ticket

Validate End-To-End MVP Demo Path

## Purpose

Validate the live MVP demo path from live ingestion through database persistence, backend APIs, analytics, alert persistence, and frontend dashboard rendering.

## Environment

- Backend URL: `http://localhost:3000`
- Frontend URL: `http://localhost:5173`
- Database: PostgreSQL
- Live data source: ThingSpeak public channel `12397`
- Dataset name: `thingspeak-live`

## Required Setup

1. PostgreSQL must be running.
2. The backend `.env` file must include database settings.
3. The backend `.env` file must include ThingSpeak settings.

```env
THINGSPEAK_CHANNEL_ID=12397
THINGSPEAK_RESULTS=10
THINGSPEAK_POLL_INTERVAL_MS=15000
THINGSPEAK_MAX_RETRIES=3
THINGSPEAK_RETRY_DELAY_MS=2000
THINGSPEAK_DATASET_NAME=thingspeak-live
```

4. JWT settings must exist for protected API paths.

```env
JWT_SECRET=dev_secret_key
REFRESH_TOKEN_SECRET=dev_refresh_secret_key
TOKEN_EXPIRY=1h
```

## Test Scope

The smoke validation covers the critical backend demo path where practical:

- Live dataset availability
- Persisted time-series access
- Stable API route behaviour
- Success response handling
- Empty-data response handling
- Validation-error response handling
- Analytics route availability
- Alert persistence readiness
- Dashboard live-data readiness

## Test Flow

1. Start the backend.
2. Confirm ThingSpeak live ingestion succeeds.
3. Confirm live data is persisted in PostgreSQL.
4. Confirm stable backend API routes return live data.
5. Confirm success, empty-data, validation-error, and service-failure outcomes where practical.
6. Confirm analytics execution readiness.
7. Confirm alert persistence readiness.
8. Confirm dashboard rendering readiness against live data.
9. Capture dashboard proof screenshot once live dashboard data is available.
10. Record blockers with owner and priority.

## Automated Smoke Test

Run from the project root while the backend is running:

```powershell
node backend/tests/mvp-e2e-smoke.js
```

The script writes results to:

```text
backend/docs/mvp/evidence/e2e-results.csv
```

## Discovery Notes

Before the smoke test was added, the live path was checked using backend logs and Thunder Client. These checks confirmed that live ingestion, database persistence, dataset APIs, series APIs, empty-data handling, validation-error handling, and filter success handling are working.

The same discovery confirmed that analytics orchestration, alert persistence, and live dashboard rendering are still incomplete in the current implementation.

## Results Summary

### Passed

- Live ingestion: ThingSpeak polling inserted rows for dataset `thingspeak-live`.
- DB persistence: Dataset API returned `thingspeak-live`.
- Stable API routes: Dataset and series endpoints returned live persisted data.
- Empty-data outcome: Missing dataset returned a clear error response.
- Validation-error outcome: Invalid filter request returned `400 Bad Request`.
- Filter success outcome: Valid filter request returned selected live fields.
- Re-runnable smoke evidence: `backend/tests/mvp-e2e-smoke.js` writes `backend/docs/mvp/evidence/e2e-results.csv`.

### Blocked

- Analytics execution: `/api/analyse` currently returns placeholder output only.
- Alert persistence: No alert table, route, controller, service, or repository exists in the active backend.
- Dashboard live rendering: Dashboard currently uses local mock data through `useSensorData(true)`.
- Dashboard proof screenshot: Cannot be honestly captured against live data until the dashboard is connected to the backend API.

## Blockers

### 1. Analytics Orchestration

- Priority: High
- Owner: Backend API / Analytics
- Blocker: Analytics orchestration is placeholder-only.
- Evidence: `POST /api/analyse` returns `Analysis completed (placeholder)`.

### 2. Alert Persistence

- Priority: High
- Owner: Backend API / Analytics
- Blocker: Alert persistence is not implemented.
- Evidence: No alert persistence route, table, service, controller, or repository exists in the active backend.

### 3. Dashboard Live Data Cutover

- Priority: High
- Owner: Frontend
- Blocker: Dashboard is not connected to live backend data.
- Evidence: Dashboard calls `useSensorData(true)` and loads local mock JSON.

### 4. Dashboard Proof Screenshot

- Priority: High
- Owner: Frontend / QA
- Blocker: `dashboard-proof.png` cannot be captured against live data yet.
- Evidence: Current dashboard renders mock data, not the live `thingspeak-live` backend series.

### 5. Service-Failure Coverage

- Priority: Medium
- Owner: QA / Backend
- Blocker: Service-failure behaviour is not fully covered by the smoke script.
- Evidence: A controlled failure mode or test-mode dependency override is needed to test service failure safely and repeatably.

## Implementation Tickets Required

### High Priority

- Backend API / Analytics: Replace placeholder `/api/analyse` response with real analytics orchestration against live dataset rows.
- Backend API / Analytics: Add alert persistence table, repository, service, and route for generated analytics alerts.
- Frontend: Cut dashboard over from local mock data to live backend series API.
- Frontend / QA: Capture `backend/docs/mvp/evidence/dashboard-proof.png` after the dashboard renders live backend data.

### Medium Priority

- QA / Backend: Add service-failure smoke coverage using a controlled dependency failure or test-mode configuration.

## Acceptance Criteria Status

### Full Live MVP Flow Is Executed End To End

- Status: BLOCKED
- Notes: Ingestion, persistence, and APIs pass. Analytics, alert persistence, and dashboard live rendering are blocked.

### Live Responses And Persisted Alerts Are Verified With Evidence

- Status: BLOCKED
- Notes: Live API responses are verified. Persisted alerts are unavailable because alert persistence is missing.

### Dashboard Proof Is Captured Against Live Data

- Status: BLOCKED
- Notes: Dashboard currently renders mock data, so live dashboard proof cannot be captured honestly yet.

### Re-Runnable Test Steps Or Test Code Cover The Critical Demo Path

- Status: PASS
- Notes: `backend/tests/mvp-e2e-smoke.js` runs smoke checks and writes `backend/docs/mvp/evidence/e2e-results.csv`.

### Remaining Blockers Are Recorded And Assigned

- Status: PASS
- Notes: Blockers are listed with owner and priority.
