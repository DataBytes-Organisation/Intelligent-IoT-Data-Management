# AFIR-04 – MVP Environment and Test Gap Tracker

## Purpose

This tracker records environment, testing, and integration gaps confirmed during the AFIR-04 baseline review.

The findings below are based on local execution and repository inspection. They are baseline findings only; fixes should be handled through the appropriate follow-up tasks.

## Current Gap and Risk Tracker

| ID | Area | Finding | Status | Risk / Impact | Recommended Follow-up |
| --- | --- | --- | --- | --- | --- |
| AFIR04-G01 | Automated Testing | Active `backend/package.json` has only a placeholder `npm test` command. | Open | Backend changes currently lack a repeatable automated regression baseline. | Wire relevant backend tests into the active test workflow. |
| AFIR04-G02 | Smoke Testing | `newBackend/tests/api.smoke.test.js` imports the non-existent `../BackendCode/app` path. | Open | Existing smoke tests cannot run against the current repository structure as written. | Align the smoke suite with the active backend application structure. |
| AFIR04-G03 | Backend Startup | `app.js` and `server.js` create separate Express applications. `/health` exists in `app.js` but not in the application started by `npm start`. | Open | Runtime behaviour differs from smoke-test expectations and may create inconsistent validation results. | Establish a single application entry point or align startup and testing. |
| AFIR04-G04 | Stream API | `mockRepository.getMockData()` is asynchronous, while `mockService.js` consumes the result synchronously. | Open | `/api/stream-names` currently fails at runtime and related stream endpoints may also be affected. | Align service methods with asynchronous repository access. |
| AFIR04-G05 | Test Data | `timeseries_long` contained 0 rows during baseline validation. | Open | Stream, analytics, and time-series integration cannot be meaningfully validated without representative data. | Establish a controlled baseline dataset or ingestion procedure. |
| AFIR04-G06 | ThingSpeak | `THINGSPEAK_CHANNEL_ID` is not configured in the local environment. | Blocked | Automatic ThingSpeak polling retries and fails, preventing live ingestion validation. | Confirm the intended project channel/configuration and retest ingestion. |
| AFIR04-G07 | Authentication | Frontend uses an email/verification-code flow while the current backend uses a different username/password authentication contract. | Open | End-to-end login/verification cannot currently be validated successfully. | Agree and document a shared frontend/backend authentication API contract. |
| AFIR04-G08 | Routing | Mock routes are included through `routes/index.js` and also mounted directly by `server.js`. | Open | Redundant registration increases routing ambiguity and maintenance risk. | Review route registration and retain one intended mounting path. |
| AFIR04-G09 | Security Configuration | Authentication falls back to development JWT secrets when environment secrets are absent. | Open | Development defaults could become a security risk if reused outside local development. | Require environment-specific secrets for deployed environments. |
| AFIR04-G10 | Integration Coverage | CSV ingestion, live ThingSpeak persistence, full series/timestamp flows, and end-to-end authentication were not fully validated in this baseline. | Pending | MVP integration failures may remain undiscovered until these flows are exercised. | Cover these flows in subsequent integration tasks/tests. |

## Confirmed Working Baseline

The following areas were successfully validated during AFIR-04:

- Backend dependencies install successfully.
- Backend starts successfully on port `3000`.
- `GET /` returns `Backend is running`.
- PostgreSQL 18 is operational locally.
- `IoTDatabase` and the existing project schema were set up successfully.
- `GET /api/datasets` successfully communicates with PostgreSQL.
- A temporary dataset was successfully created through `POST /api/datasets`.
- The created dataset was successfully retrieved through the backend API.
- The API-created record was independently confirmed in PostgreSQL.
- Temporary AFIR-04 test data was removed after validation.
- Frontend dependencies install successfully.
- Vite frontend starts successfully on port `5173`.
- Frontend login interface renders successfully.

## Baseline Risks to Share

The highest-priority risks identified from the current baseline are:

1. **No active automated backend regression baseline** – the available smoke suite is disconnected from the current backend structure.
2. **Runtime/test application inconsistency** – `app.js` and `server.js` do not expose identical behaviour.
3. **Stream-data path failure** – asynchronous PostgreSQL access is currently consumed incorrectly by the service layer.
4. **ThingSpeak integration blocked** – live polling cannot be validated without the intended channel configuration.
5. **Frontend/backend authentication mismatch** – the current authentication contracts prevent complete end-to-end validation.
6. **Insufficient baseline time-series data** – an empty `timeseries_long` table limits meaningful integration testing.
7. **Development security defaults** – fallback JWT secrets must not be relied upon in deployed environments.

## AFIR-04 Baseline Status

Environment review: **Completed**

Current smoke/test review: **Completed**

Environment and integration gaps: **Documented**

Risk sharing: **Pending team communication**

Detailed validation evidence is recorded in:

- `backend/docs/mvp/test-plan.md`
- `backend/docs/mvp/operations-runbook.md`

This tracker should be updated as the identified gaps are assigned, resolved, or revalidated.

---

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
