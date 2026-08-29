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