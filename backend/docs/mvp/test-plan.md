
# MVP Demo Test Plan

## Scope

This plan covers no-mock-data demo validation for the backend and frontend integration path. The demo must prove live ingestion, database persistence, dataset and series APIs, analytics or alert visibility, and dashboard consumption using the active server path.

## Entry Criteria

- Backend starts from `backend/src/server.js`.
- Required environment variables are loaded from `backend/.env` or the deployment secret mechanism.
- PostgreSQL is reachable with the configured `DB_*` variables.
- The demo database has the required schema applied.
- ThingSpeak channel settings are configured for the live ingestion path.
- Frontend uses the backend API base URL for demo validation.

## Automated Smoke Checks

Run from `backend/`:

```bash
npm test
```

The automated smoke checks verify:

- `GET /health` returns HTTP 200 from the active server.
- `GET /ready` is mounted and returns either HTTP 200 or a controlled HTTP 503.
- `POST /api/datasets/:name/series/filter` is mounted and validates missing `streamNames`.

## Manual Demo Checks

- Start the backend with `npm start`.
- Confirm startup logs show the backend URL.
- Confirm ThingSpeak polling starts when not disabled.
- Confirm a successful poll logs `feedCount > 0`.
- Confirm a successful persistence path logs or records `savedCount > 0`.
- Confirm the demo dataset exists through `GET /api/datasets`.
- Confirm `GET /api/datasets/thingspeak-live/series` returns persisted rows.
- Confirm `GET /api/datasets/thingspeak-live/timestamps` returns timestamps.
- Confirm analytics or alert outputs are visible through the available API or evidence files.
- Confirm the frontend dashboard can consume the live API path when integration is enabled.

## Priority Gaps

| ID | Gap | Priority | Validation Target |
|---|---|---|---|
| B-02 | Active server health/readiness probes were missing or inconsistent | Critical | `/health`, `/ready`, `npm test` |
| B-08 | Environment loading assumptions were inconsistent across startup and DB bootstrap | High | `backend/.env`, runbook setup notes |
| B-09 | `npm test` did not run executable smoke checks | High | `backend/test/startup-health.test.js` |
| B-10 | Demo database/schema safety needs explicit validation before repeat demos | Medium | `/ready`, DB check commands, schema warning |
| B-11 | Frontend dashboard still needs final live API consumption validation | Medium | manual dashboard check against backend API |

## Exit Criteria

- Critical startup and route smoke checks pass locally.
- Environment and bootstrap assumptions are documented.
- Automated and manual test gaps are prioritised.
- Demo blockers have owners and validation targets in the MVP tracker.
- Demo entry and exit criteria are clear for repeat validation.

