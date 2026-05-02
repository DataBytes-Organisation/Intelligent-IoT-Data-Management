# Proposed Technical Contributions (Beyond Documentation)

This document lists practical contributions that are small enough for a capstone timeline but strong enough to demonstrate real engineering work.

## Implemented Non-Disruptive Contributions

The following additions were implemented in a backward-compatible way, without changing existing endpoint behavior:

1. Health endpoint for service reliability baseline
2. Backend smoke test pack for core APIs
3. Startup/run commands to standardize local execution

### Evidence

- Health route: `newBackend/BackendCode/app.js`
- Server startup entrypoint (unchanged behavior): `newBackend/BackendCode/server.js`
- Smoke tests: `newBackend/tests/api.smoke.test.js`
- Test/start scripts: `newBackend/package.json`

## Contribution 1 - Unified API Integration Path (High impact, low effort)

### What to build
- Connect `new-frontend/frontend` to `newBackend/BackendCode` as default runtime.
- Remove hardcoded mock-first behavior for normal demo mode.

### Why it matters
- Shows complete working software architecture, not isolated code pieces.

### Deliverable evidence
- Screen recording: stream selection -> filtered data -> updated chart.
- Commit diff in:
  - `new-frontend/frontend/src/hooks/useSensorData.js`
  - `new-frontend/frontend/src/services/api.js` (new)
  - `newBackend/BackendCode/routes/mock.js`

## Contribution 2 - Health + Reliability Baseline

### What to build
- Add `GET /health` endpoint in backend.
- Add startup script/checklist showing all services are available.

### Why it matters
- Demonstrates software quality thinking and deployment awareness.

### Deliverable evidence
- Curl output showing healthy status.
- Optional CI/local script to validate endpoint before demo.

### Implementation status

- Added `GET /health`
- Response contract:

```json
{
  "status": "ok",
  "timestamp": "2026-04-30T12:34:56.000Z",
  "uptimeSeconds": 123.45
}
```

## Contribution 3 - Correlation Insight Module (Data Science + Engineering bridge)

### What to build
- Implement a reusable module to compute top correlated stream pair for selected time window.
- Display result in dashboard as a summary card.

### Why it matters
- Converts notebook-style analysis into reusable application feature.

### Deliverable evidence
- New utility/service function with deterministic output.
- UI component showing pair + coefficient + interpretation.

## Contribution 4 - Lightweight Test Pack

### What to build
- 3-6 backend tests and 2-3 frontend smoke checks.

### Why it matters
- Provides objective proof of correctness.

### Deliverable evidence
- Test run output captured in report appendix.

### Implementation status

Implemented smoke tests for:

- `GET /`
- `GET /health`
- `GET /api/stream-names`
- `POST /api/filter-streams` invalid payload handling

Run command:

```bash
cd newBackend
npm test
```

## Local Runbook (WSL-friendly)

### Backend only

```bash
cd newBackend
npm install
npm start
```

### Health check

```bash
curl http://localhost:3000/health
```

## Recommended Final Combination for Capstone

If time is limited, implement this exact combination:

1. Contribution 1 (Unified API path)
2. Contribution 2 (Health endpoint)
3. Contribution 3 (Correlation insight module)

This gives architecture clarity, data science value, and engineering credibility.
