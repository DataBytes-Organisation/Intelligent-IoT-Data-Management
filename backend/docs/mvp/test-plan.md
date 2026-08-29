# AFIR-04 – MVP Test Plan and Current Validation Baseline

## 1. Purpose

This document records the current environment and test baseline for the Intelligent IoT Data Management MVP.

The objective of AFIR-04 is to verify the current backend environment, review existing smoke/integration checks, and identify issues affecting backend, PostgreSQL, ThingSpeak, and frontend integration.

Detailed setup instructions are maintained in `operations-runbook.md`, while confirmed gaps and risks are tracked in `mvp-tracker.md`.

## 2. Environment Reviewed

The following local environment was validated:

- Backend: Node.js + Express
- Database: PostgreSQL 18
- Local database: `IoTDatabase`
- Frontend: React + Vite
- Backend port: `3000`
- Frontend port: `5173`
- PostgreSQL port: `5432`
- Python 3.12 available for Python-based components

Backend and frontend dependencies installed successfully.

The backend starts using:

```text
npm start
→ node src/server.js
```

The frontend starts using:

```text
npm run dev
```

## 3. Validation Results

| Check | Result | Observation |
| --- | --- | --- |
| Backend dependency installation | PASS | `npm install` completed successfully |
| Backend startup | PASS | Express starts on port `3000` |
| `GET /` | PASS | Returns `Backend is running` |
| PostgreSQL setup | PASS | PostgreSQL 18 and `IoTDatabase` operational |
| Database schema | PASS | Existing backend schema applied successfully |
| `GET /api/datasets` | PASS | Returned HTTP `200` and `[]` on clean database |
| `POST /api/datasets` | PASS | Temporary validation dataset created successfully |
| `GET /api/datasets/:id` | PASS | Temporary dataset retrieved successfully |
| Direct PostgreSQL verification | PASS | API-created record confirmed in database |
| Test-data cleanup | PASS | Temporary AFIR-04 dataset removed |
| `GET /health` | FAIL | Normal `npm start` application does not expose this route |
| `GET /api/stream-names` | FAIL | Runtime error in current stream-data path |
| `timeseries_long` baseline | GAP | Table contained `0` rows |
| ThingSpeak polling | BLOCKED | `THINGSPEAK_CHANNEL_ID` missing |
| Existing smoke suite | GAP | Not connected to current backend structure/test command |
| Backend `npm test` | GAP | Current script is a placeholder |
| Frontend dependency installation | PASS | `npm install` completed successfully |
| Frontend startup | PASS | Vite starts on port `5173` |
| Frontend UI | PASS | Login interface renders |
| End-to-end authentication | GAP | Frontend/backend authentication contracts are not aligned |

## 4. Backend and PostgreSQL Baseline

Backend-to-PostgreSQL connectivity was validated using the dataset metadata API.

A temporary dataset named:

`AFIR04_BASELINE_TEST`

was created using `POST /api/datasets` and successfully retrieved using `GET /api/datasets/:id`.

The record was independently verified in PostgreSQL and removed after validation.

This confirmed the working path:

```text
HTTP Request
→ Express Route
→ Controller
→ Service
→ Repository
→ PostgreSQL
→ API Response
```

The `timeseries_long` table contained `0` rows during baseline testing, so time-series functionality does not currently have populated local baseline data.

## 5. Existing Smoke-Test Review

An existing smoke suite was identified at:

`newBackend/tests/api.smoke.test.js`

It contains checks for:

- `GET /`
- `GET /health`
- `GET /api/stream-names`
- `POST /api/filter-streams`
- `GET /api/data-profile`
- `POST /api/top-correlated-pair`

However, the suite imports:

`../BackendCode/app`

which does not exist in the current repository structure.

The current application module is located at:

`backend/src/app.js`

The active `backend/package.json` also contains only a placeholder `npm test` command.

Therefore, the existing smoke suite is not currently runnable through the active backend test workflow.

## 6. Application Startup Observation

The backend contains both:

- `backend/src/app.js`
- `backend/src/server.js`

`app.js` defines a `/health` endpoint and exports an Express application.

The normal `npm start` workflow instead executes `server.js`, which creates a separate Express application.

As a result:

`GET /health`

through the normally started backend returns:

`Cannot GET /health`

This creates a mismatch between the existing smoke-test expectations and normal runtime behaviour.

## 7. Stream API Observation

Manual validation of:

`GET /api/stream-names`

returned:

```json
{
  "error": "Failed to get stream names"
}
```

The backend log reported:

`TypeError: Cannot convert undefined or null to object`

Repository review identified that `mockRepository.getMockData()` performs asynchronous PostgreSQL access, while the current service layer consumes the result synchronously without awaiting it.

This is a confirmed implementation gap affecting the stream-data path.

## 8. ThingSpeak Baseline

ThingSpeak polling starts automatically when the backend starts.

Current result: **BLOCKED**

The backend reports:

`THINGSPEAK_CHANNEL_ID is missing in .env`

The service retries three times before reporting the polling failure.

The backend continues running despite the ThingSpeak failure.

A valid project ThingSpeak configuration is required before live ingestion can be validated.

## 9. Frontend Integration Baseline

The React/Vite frontend installs and starts successfully on port `5173`.

The login interface renders successfully.

However, complete authentication could not be validated.

The frontend expects an email/verification-code flow, while the current backend uses a different username/password authentication contract and does not expose the complete verification/resend flow expected by the frontend.

This is therefore recorded as an integration gap rather than a local frontend startup failure.

## 10. Additional Observations

The baseline review also identified:

- Mock routes are registered through `routes/index.js` and again directly in `server.js`.
- Authentication uses development fallback JWT secrets when environment secrets are absent.
- CSV ingestion was not validated during this baseline.
- Live ThingSpeak persistence was not validated because the required channel configuration is unavailable.
- Automated integration/regression coverage is currently insufficient.

These items are tracked in `mvp-tracker.md` for follow-up.

## 11. Baseline Conclusion

The local development environment is operational for continued MVP integration work.

Backend startup, frontend startup, PostgreSQL connectivity, database schema setup, and dataset metadata read/write operations were successfully validated.

The baseline also identified confirmed gaps involving:

- Automated backend testing
- Application startup/test consistency
- Stream-data asynchronous database handling
- Time-series test-data availability
- ThingSpeak configuration
- Frontend/backend authentication alignment

The detailed environment setup is documented in `operations-runbook.md`, and the identified gaps and risks are maintained in `mvp-tracker.md`.