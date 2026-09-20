# Low Level Design (LLD) - Intelligent IoT Data Management

## 1. Purpose and Scope

This document defines code-level behavior for the current converged runtime path:

- Frontend: `new-frontend/frontend`
- Backend API: `backend` (Node/Express)
- Analytics integration: `analytics_integration` (Python, Dockerized)
- Persistence: PostgreSQL 16 (containerized)
- Monitoring: `monitoring/` (Prometheus, Grafana, docker service exporter)
- Optional analytics assets: `data_science/algorithms`
- Optional extension backend: `backend/iot_backend` (Django DRF)

Repository sync note (2026-09-12): this LLD reflects the converged pilot runtime after the full-integration merge (auth + dataset + analytics APIs wired to the real backend, PostgreSQL persistence, live ThingSpeak ingestion, and live monitoring stack).

The goal is to provide implementation-ready detail for API contracts, module responsibilities, runtime flow, algorithms, testing, and operational behavior.

---

## 2. Runtime Topology and Ports

### 2.1 Primary runtime (current)

- Browser -> React/Vite app (`new-frontend/frontend`)
- React app (proxy) -> Node/Express API (`backend`)
- Node API -> PostgreSQL (`datasets`, `timeseries`, `auth_users`, `auth_mfa_challenges`)
- Node API -> `analytics_integration` service for `/api/analyse`
- Node API -> ThingSpeak polling channel `1350261`
- Monitoring: `backend /metrics`, `docker_exporter` -> Prometheus -> Grafana

### 2.2 Port map

- Frontend dev server: `5173`
- Backend API: `3000`
- Analytics integration: `5002`
- PostgreSQL: `5432`
- Prometheus: `9090`
- Grafana (host): `3001`
- Docker service exporter: `9104`
- MailHog SMTP: `1025` / web UI: `8025`
- Optional Django backend: `8000`

---

## 3. Source-Level Module Map

## 3.1 Frontend module ownership (`new-frontend/frontend/src`)

- `pages/`: route pages (`Login`, `RegistrationPage`, `ForgotPassword`, `HomePage`, `DashboardPage`)
- `components/`: rendering and interaction units (selectors, charts, stats, correlation cards, shared layout/navbar/footer, dataset card, `ProtectedRoute` route guard, `UploadDatasetDialog`)
- `hooks/`: data loading and filtering logic
- `utils/`: math and helper logic (correlation, variance, trendline)
- `data/`: mock datasets for offline mode
- `services/`: API service clients (`authClient.js`, `datasetService.js`, analysis services) with axios `withCredentials`

### 3.2 Backend module ownership (`backend`)

- `src/server.js`: server bootstrap; starts ThingSpeak polling
- `src/app.js`: Express assembly, middleware (CORS + credentials, JSON, cookie parser, metrics), mounts `/api` route families, `/health`, `/ready`, `/metrics`
- `src/routes/`: `index.js`, `auth.js`, `datasetRoutes.js`, `seriesRoutes.js`, `timestampsRoutes.js`, `telemetry.js`, `analyseRoutes.js`, `thingspeak.js`, `mock.js`
- `src/controllers/`: `authController.js`, `datasetsController.js`, `seriesController.js`, `timestampsController.js`, `dataController.js`, `analyseController.js`, `thingspeakController.js`
- `src/services/`: `authService.js`, `datasetService.js`, `datasetImportService.js`, `timeseriesService.js`, `analyseService.js`, `thingspeakService.js`, `emailService.js`
- `src/repositories/`: `userRepository.js`, `authRepository.js`, `datasetRepository.js`, `timeseriesRepository.js`, `thingspeakRepository.js`, `mockRepository.js`
- `src/middleware/`: `authMiddleware.js` (JWT), `roleMiddleware.js` (role guard)
- `src/monitoring/`: `metrics.js` (Prometheus counters/histograms)

### 3.3 Analytics integration (`analytics_integration`)

- `api/server.py`: analysis HTTP service (metrics-instrumented; fixed timer usage observed in pilot fixes)

---

## 4. Backend LLD (Node/Express)

### 4.1 Boot sequence

Files: `backend/src/app.js`, `backend/src/server.js`

1. `server.js` loads env, connects to PostgreSQL, starts ThingSpeak polling (`startThingSpeakPolling`), and binds the server.
2. `app.js` creates Express app.
3. `app.js` registers middleware:
   - `cors()` with credentials support
   - `express.json()`
   - cookie parser
   - metrics middleware
4. `app.js` registers root, health, ready and metrics routes (`GET /`, `GET /health`, `GET /ready`, `GET /metrics`).
5. `app.js` mounts API routes under `/api` (auth, datasets/series/timestamps, telemetry, analyse, thingspeak, mock).
6. `server.js` binds to `PORT` (default `3000`).

### 4.2 Environment contract

File: `backend/.env` (template: `backend/.env.example`)

- `DB_*` / `DATABASE_URL`: PostgreSQL connection
- `JWT_*`: token signing/expiry
- `THINGSPEAK_CHANNEL_ID` (= `1350261`), `THINGSPEAK_RESULTS` (= `10`), `THINGSPEAK_POLL_INTERVAL_MS` (= `15000`), `THINGSPEAK_MAX_RETRIES`, `THINGSPEAK_RETRY_DELAY_MS`, `THINGSPEAK_DATASET_NAME` (= `thingspeak-live`)
- `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, `MAIL_PROVIDER`, `MAIL_TRANSPORT` (MailHog in dev)
- `ANALYTICS_URL` (analytics integration service address)
- `PROCESSED_DATA_PATH`: path to JSON dataset used by mock repository

### 4.3 API endpoint definitions

Base: `/api`

#### `GET /health` (service-level)

- Purpose: backend readiness/liveness signal for operational checks
- Location: `backend/src/app.js`
- Status: implemented; used by container health checks
- Success: `200` with JSON payload

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptimeSeconds": 123.45
}
```

#### `GET /ready` (service-level)

- Purpose: dependency readiness (checks DB/ingestion prerequisites)
- Success: `200` when dependencies ready

#### `GET /metrics`

- Purpose: Prometheus metrics export
- Location: `backend/src/monitoring/metrics.js` + `metricsMiddleware`
- Success: `200` with text exposition format

#### Auth endpoints (`POST /api/auth/...`)

Route module: `backend/src/routes/auth.js` -> `authController.js` -> `authService.js` (+ `userRepository.js`, `authRepository.js`, `emailService.js`)

- `register` `{ email, password, confirmPassword }`
  - Validation: password >= 12 chars, upper+lower+digit+special; email format
  - Success: `201` with created user envelope
- `login` `{ email, password }`
  - Verifies bcrypt hash; on success creates MFA challenge, emails 6-digit OTP (SMTP/MailHog), returns `{ mfaChallengeId, expiresInSeconds, delivery }`
  - Failure: `401` with `INVALID_CREDENTIALS`
- `mfa/verify` `{ mfaChallengeId, otp, rememberMe }`
  - Verifies challenge (exists, not used, within expiry/attempts, OTP hash match)
  - Success: `200` `{ accessToken, expiresInSeconds, user }`; sets `iot_refresh` HttpOnly cookie (`Path=/api/auth`, `SameSite=Lax`)
  - Failure: `400` `OTP_INVALID`, `OTP_EXPIRED`, or max-attempts error
- `mfa/resend` — regenerates challenge + OTP within rate limits
- `refresh` — issues new access token from refresh cookie; `401 SESSION_EXPIRED` if invalid
- `logout` — clears session/cookie
- `password-reset/request`, `password-reset/confirm` — flow with reset token
- `admin/users` `GET` — role-protected (`authMiddleware` + `roleMiddleware("admin")`)

#### Dataset endpoints

Route module: `backend/src/routes/datasetRoutes.js` (+ `seriesRoutes.js`, `timestampsRoutes.js`) -> controllers -> `datasetService.js` / `timeseriesService.js` -> `datasetRepository.js` / `timeseriesRepository.js`

- `GET /api/datasets` — list datasets (e.g. `thingspeak-live`)
- `POST /api/datasets` — create/upload dataset
- `GET /api/datasets/:name/series` — sensor series for dataset
- `POST /api/datasets/:name/series` — insert series rows
- `GET /api/datasets/:name/timestamps` — available timestamps
- `POST /api/telemetry/*` — timeseries/telemetry ingest and query (wide rows in `timeseries`)

#### `POST /api/analyse`

Route: `backend/src/routes/analyseRoutes.js` -> `analyseController.js` -> `analyseService.js`

- Request: `{ dataset, model: { detector, metric }, correlation: { streams, window_size, step_size, method } }`
- Flow: `loadRows` (from `request.data` or dataset rows via `timeseriesService.getWideEntriesForDatasetName`) -> `callAnalytics` to `${analyticsUrl()}/analytics/analyze`
- Success: `200` with `{ alerts, correlations }`
- Failure: `400 VALIDATION_ERROR`, `404 DATASET_NOT_FOUND`, `503 ANALYTICS_UNAVAILABLE`, `504 ANALYTICS_TIMEOUT`

#### ThingSpeak endpoints (`/api/thingspeak/*`)

- Feed/status read endpoints backed by `thingspeakRepository` / `thingspeakService`.

#### Legacy mock endpoints (retained)

- `GET /api/streams`, `GET /api/stream-names`, `POST /api/filter-streams`, `GET /api/data-profile`, `POST /api/top-correlated-pair` via `mockRepository` / `mockService` (offline fallback).

### 4.4 Layer logic details

#### Repositories (primary DB-backed)

- `userRepository.js`: user CRUD against `auth_users` (email uniqueness, role).
- `authRepository.js`: MFA challenge and session persistence against `auth_mfa_challenges` (hash, expiry, attempts, used_at, resend window).
- `datasetRepository.js`: dataset rows against `datasets`.
- `timeseriesRepository.js`: wide-row insert/upsert into `timeseries` (`ON CONFLICT (dataset_id, entry_id) DO NOTHING`), queries by dataset/time range.
- `thingspeakRepository.js`: fetches `https://api.thingspeak.com/channels/{channelId}/feeds.json?results=N` with optional read API key; returns feeds for ingestion.
- `mockRepository.js`: legacy file-backed reader (`PROCESSED_DATA_PATH`), used for offline fallback only.

#### Services

- `authService.js`: register (bcrypt), login (credential verify + MFA challenge + OTP email), `verifyMfa` (challenge validation + OTP hash compare + token issuance + refresh cookie), refresh, logout, password reset.
- `datasetService.js` / `datasetImportService.js`: dataset create/list, CSV/JSON upload, series import.
- `timeseriesService.js`: wide-entry reads, dataset-name lookups for analysis.
- `analyseService.js`:
  - builds analysis payload (detector model, correlation streams/window),
  - `loadRows` (from `request.data` or named dataset),
  - `callAnalytics` with timeout/abort -> `$ANALYTICS_URL/analytics/analyze`,
  - maps `503`/`504` errors.
- `thingspeakService.js`:
  - `pollThingSpeakData()` upserts dataset row and inserts each feed as wide row,
  - `startThingSpeakPolling()` runs immediate poll + `setInterval` every `THINGSPEAK_POLL_INTERVAL_MS` (15s) with `THINGSPEAK_MAX_RETRIES`/`THINGSPEAK_RETRY_DELAY_MS`.
- `emailService.js`: nodemailer SMTP send; dev delivery via MailHog; MFA subject/text includes the 6-digit secret.

#### Controllers

- Wrap service calls in `try/catch` and shape error envelopes `{ error: { code, message }, meta: { requestId } }`.
- `authController.js` handles register/login/MFA/refresh/logout/reset.
- `datasetsController.js`/`seriesController.js`/`timestampsController.js`/`dataController.js` handle dataset families.
- `analyseController.js` forwards to `analyseService.runAnalysis`.
- `thingspeakController.js` exposes feed/status.
- Legacy `mockController.js` retained only for mock endpoints.

---

## 5. Frontend LLD (React/Vite)

### 5.1 Route/page composition

- Public routes:
  - `/` -> `Login`
  - `/register` -> `RegistrationPage`
  - `/forgot-password` -> `ForgotPassword`
- Protected routes:
  - `/home` -> `ProtectedRoute` -> `Layout` -> `HomePage`
  - `/dashboard/:id` -> `ProtectedRoute` -> `Layout` -> `DashboardPage`
- Informational routes:
  - `/about` -> `AboutPage`
- `Layout` composes shared `Navbar` and `Footer` around protected content.
- `DashboardPage` renders `Dashboard` feature composition.
- Dashboard contains selection controls, charting, mini insight-card graphs, expandable statistics, sensor highlighting, anomaly markers, precise time-range controls, stats, and correlation insights.

### 5.2 Hook contracts

#### `useSensorData(useMock = false)`

File: `new-frontend/frontend/src/hooks/useSensorData.js`

- Returns: `{ data, loading, error }`
- If `useMock === true`, loads local `sensorData1.json`
- Else requests `/api/sensor-data` (currently not aligned with Node routes)

#### `useStreamNames(data)`

File: `new-frontend/frontend/src/hooks/useStreamNames.js`

- Derives stream keys from first row
- Excludes `entry_id`, `created_at`
- Returns array: `{ id: key, name: key }`

#### `useFilteredData(data, filters)`

File: `new-frontend/frontend/src/hooks/useFilteredData.js`

- Filters by optional:
  - time range (`startTime`, `endTime`)
  - id range (`minEntryId`, `maxEntryId`)
- Projects output to selected stream keys + identifiers

### 5.3 Dashboard interaction state machine

File: `new-frontend/frontend/src/components/Dashboard.jsx`

- `streamCount = 0`: show empty instruction
- `streamCount = 1`: show guidance to select second stream
- `streamCount = 2`: show scatter plot for chosen pair
- `streamCount >= 3`: compute and show most-correlated pair

Additional widgets:

- Per-stream stats cards (`StreamStats`)
- Multi-line chart over selected streams (`Chart`)

### 5.4 Correlation and trendline internals

#### Pearson correlation

File: `new-frontend/frontend/src/utils/correlationUtils.js`

`calculateCorrelation(x, y)` uses:

- means of both arrays
- covariance-like numerator: `sum((xi - avgX) * (yi - avgY))`
- normalized denominator: `sqrt(sum((xi-avgX)^2) * sum((yi-avgY)^2))`
- return value in `[-1, 1]` (subject to finite denominator)

#### Best pair selection

`findMostCorrelatedPair(data, streams)`:

- loops all unique pairs `(i, j)`
- computes correlation for each pair
- tracks largest positive value (`maxCorr`)
- returns `{ pair: [a, b], correlation }`

Complexity:

- `k` streams, `n` points
- pair count: `k * (k - 1) / 2`
- runtime: `O(k^2 * n)`

#### Variance guard

File: `new-frontend/frontend/src/utils/varianceUtils.js`

- `hasVariance(data, key)` checks unique numeric values count > 1
- prevents meaningless scatter interpretation when stream is constant

#### Trendline generation

File: `new-frontend/frontend/src/utils/trendlineUtils.js`

- simple linear regression on scatter points
- calculates slope/intercept
- returns two points `(xMin, yMinFit)`, `(xMax, yMaxFit)`

### 5.5 Auth service contract (`authClient.js`)

File: `new-frontend/frontend/src/services/authClient.js`

- Axios instance with `withCredentials: true`, base proxy `/api`, targeting `VITE_PROXY_TARGET`.
- Functions: `registerUser`, `loginUser`, `verifyTwoFactorCode`, `resendTwoFactorCode`, `refreshSession`, `logout`, `getAccessToken`, `setAccessToken`, `clearAccessToken`, `saveAuthSession`.
- Access token held in memory with `sessionStorage` fallback key `iot_token` (survives refresh).
- `refreshSession` calls `POST /api/auth/refresh`; on `401` session is cleared.
- Manual route protection (`ProtectedRoute.jsx`) checks `getAccessToken()`; triggers `refreshSession()` when the in-memory token is absent before rendering protected content.

### 5.6 Known implementation notes

- Pilot login flow is wired to the real backend and MFA (MailHog OTP) and verified end-to-end.
- Dashboard analysis requests go to `POST /api/analyse` (backend -> analytics integration service).
- Legacy hook `useSensorData` may still default to mock where dataset pages use the datasets API; dataset-driven pages use `datasetService.js` against `/api/datasets`.

---

## 6. Data Model and Contract

### 6.1 PostgreSQL persistence (pilot primary)

Schema initialized from `backend/src/db/schema.sql`:

- `datasets` — dataset records (id, name, metadata), e.g. `thingspeak-live`
- `timeseries` — wide-format sensor rows: `dataset_id`, `created_at`, `entry_id`, `field1`..`field8` with unique constraint `(dataset_id, entry_id)`
- `timeseries_long` — long-format rows used by CSV ingestion
- `auth_users` — registered users (id, email, password hash, role, created_at)
- `auth_mfa_challenges` — MFA challenges (id, user_id, `token_hash`, `expires_at`, `attempts`, `resend_after`, `remember_me`, `used_at`)

### 6.2 Canonical record (timeseries/wide row)

```json
{
  "created_at": "2025-03-19T15:01:59.000Z",
  "entry_id": 3242057,
  "field1": 22.0,
  "field3": 41.0
}
```

Field mapping for ThingSpeak channel `1350261` (via `CHANNEL_FIELD_MAPPINGS` in `analyseService.js`): `field1=eco2`, `field2=etvoc`, `field3=temperature`, `field4=air_pressure`, `field5=humidity`, `field6=temperature_secondary`, `field7=controller_temperature`, `field8=conductance`.

### 6.3 Field semantics

- `created_at`: ISO timestamp string, source event time
- `entry_id`: monotonically increasing source identifier (unique per dataset)
- `field1..field8`: ThingSpeak feed field values persisted wide
- `was_interpolated`: optional preprocessing marker in curated records

### 6.4 Data validation expectations

- all output records must include `created_at`, `entry_id`
- wide-row inserts use `ON CONFLICT (dataset_id, entry_id) DO NOTHING`
- missing stream values may be omitted or set `null` consistently per endpoint policy

---

## 7. Low-Level Sequence Flows

### 7.0 Login + MFA flow (pilot)

1. `Login.jsx` calls `loginUser(email, password)` -> `POST /api/auth/login`.
2. `authService` verifies bcrypt hash; creates MFA challenge in `auth_mfa_challenges`; `emailService` sends 6-digit OTP via SMTP (MailHog); returns `{ mfaChallengeId, expiresInSeconds, delivery }`.
3. User enters OTP; `verifyTwoFactorCode` -> `POST /api/auth/mfa/verify`.
4. `authService` looks up challenge by id, checks expiry/attempts/`used_at`, hashes entered OTP and compares to `token_hash`.
5. On match: issues `accessToken`, sets `iot_refresh` HttpOnly cookie, marks challenge used; returns `{ accessToken, expiresInSeconds, user }`.
6. `Login.jsx` calls `saveAuthSession(session)` (stores `accessToken` + `sessionStorage.iot_token`), navigates to `/home`.
7. `ProtectedRoute` sees token; renders protected content. Later 401s trigger `refreshSession` -> `POST /api/auth/refresh`.

### 7.1 Stream selection and filtering

1. User selects streams in `StreamSelector`
2. Dashboard updates `selectedStreams` state
3. `useFilteredData` recomputes projected dataset
4. `Chart` and `StreamStats` re-render from filtered output

### 7.2 Two-stream insight path

1. User selects exactly two streams
2. `ScatterPlot` maps rows to `{ x, y }`
3. `getTrendline` computes linear fit
4. Recharts renders points and trendline

### 7.3 Three-or-more stream insight path

1. User selects at least three streams
2. `findMostCorrelatedPair` computes best pair
3. `MostCorrelatedPair` validates variance for both streams
4. UI shows pair name, coefficient, scatter chart

### 7.4 Dataset analysis flow

1. User triggers analysis on a dataset (e.g. `thingspeak-live`) from the dashboard.
2. Frontend calls `POST /api/analyse` with `{ dataset, model, correlation }`.
3. `analyseService.loadRows` reads wide entries for the dataset from `timeseries` (unless `data` supplied).
4. `analyseService.callAnalytics` POSTs to analytics integration `/analytics/analyze`.
5. Response `{ alerts, correlations }` returned; UI renders anomaly alerts and correlation views.

### 7.5 ThingSpeak ingestion flow

1. On boot, `startThingSpeakPolling` runs an immediate poll, then `setInterval` every `THINGSPEAK_POLL_INTERVAL_MS`.
2. `pollThingSpeakData` fetches current feeds from channel, upserts `thingspeak-live` dataset, inserts each feed row into `timeseries` (`ON CONFLICT DO NOTHING`).
3. Monitoring counters record poll attempts, duration, rows inserted and retries.

---

## 8. Error Handling and Resilience

### 8.1 Backend

- Repository/service exceptions are translated to structured error envelopes `{ error: { code, message }, meta: { requestId } }`
- Validation failures return `400` (`VALIDATION_ERROR`, `OTP_INVALID`, `OTP_EXPIRED`)
- Missing dataset returns `404` (`DATASET_NOT_FOUND`)
- Auth failures return `401` (`INVALID_CREDENTIALS`, `SESSION_EXPIRED`); missing/invalid bearer token via `authMiddleware` -> `401`; insufficient role via `roleMiddleware` -> `403`
- Analytics unavailability/timeout -> `503` (`ANALYTICS_UNAVAILABLE`) / `504` (`ANALYTICS_TIMEOUT`)

### 8.2 Frontend

- hook-level loading and error states are surfaced in dashboard
- `authClient` handles 401 by attempting `refreshSession`; on failure clears session
- when variance is insufficient, component returns explanatory text instead of chart

### 8.3 Operational guardrails

- validate `.env` / compose configuration before startup
- DB holds canonical storage; file-backed mock retained only for offline/demo fallback
- MailHog (dev) substitutes as SMTP for OTP delivery without external dependencies

---

## 9. Service Integration Details

### 9.0 Analytics integration service (pilot primary)

- Location: `analytics_integration/`, containerized, port `5002`.
- Backend `POST /api/analyse` delegates to `${ANALYTICS_URL}/analytics/analyze`.
- Instrumented with request duration and error metrics; consumes large rows efficiently.
- Contract: request contains dataset/model/correlation; response contains `alerts` and `correlations`.

### 9.1 Extended service paths

- Flask analytics service: `data_science/development/server.py` (`:5000`) — algorithm experimentation/CSV upload analytics
- Django DRF service: `backend/iot_backend` (`:8000`) — model-backed REST path (extension)
- Primary Node path is the DB-backed pilot API over PostgreSQL.

### 9.1.1 DB implementation note

- Pilot persistence is PostgreSQL via Node repositories (`datasetRepository`, `timeseriesRepository`, `userRepository`, `authRepository`).
- File-backed `mockRepository` retained as offline fallback; repository contracts remain swappable without route-level refactor.

### 9.4 Backend auth (live)

- Full JWT + bcrypt + MFA implemented (`authService.js`, `authController.js`, routes `POST /api/auth/*`).
- Routes classify as public vs protected; `authMiddleware` enforces `Authorization: Bearer <token>`; `roleMiddleware` enforces roles.
- Frontend `authClient.js` aligned with backend token issuance/verification and standardized error payloads; verify/refresh/logout verified.

### 9.5 Data science stream note (fork reference)

- External DS fork reference: `https://github.com/Yashdeep22/Intelligent-IoT-Data-Management`
- Commit trail indicates a richer detector and benchmarking pipeline, including:
  - ThresholdAD (`2ead71a`)
  - LOF detector + edge guard (`2707a31`, `a67ac40`)
  - benchmark label handling and NAB support (`6d21e24`, `f31fad3`)
  - combined benchmark reporting (`7ab182b`)

Low-level implication:

- Keep analytics adapters behind a stable detector interface (fit/score/predict contract) so detector substitution does not affect API shape.
- Treat benchmark/report scripts as offline evaluation modules and avoid coupling them to request/response critical path.

### 9.2 Contract mismatch note (legacy)

- `frontend/src/AnalyzePanel.jsx` historically called `POST http://localhost:5000/api/analyze` (Flask, no `/api` prefix, multipart vs JSON). Legacy only; pilot analysis goes through `POST /api/analyse` -> analytics integration.

### 9.3 Additional frontend track note

- `frontend/src/App.jsx` includes legacy `Login`, `Register`, `AnalyzePanel` routes and MUI theme switching.
- `new-frontend/frontend` is the primary runtime UI with full auth + protected-layout route structure.
- For convergence, keep `new-frontend/frontend` as primary runtime UI path and treat `frontend` as adjacent/legacy path unless the team explicitly consolidates.

---

## 10. Testing Strategy (Low-Level)

### 10.1 Backend unit/integration tests

- repository test:
  - auth: register persists user, duplicate email rejected, MFA challenge created with hashed token
  - dataset/timeseries: upsert idempotent on `(dataset_id, entry_id)`, wide-row reads
- service test:
  - `authService.verifyMfa` accepts valid OTP, rejects wrong/expired/over-attempt
  - `analyseService.loadRows` resolves dataset or accepts `data`
- route test:
  - `GET /health` -> `200` and health payload
  - `POST /api/auth/register` -> `201`
  - `POST /api/auth/login` -> challenge envelope
  - `POST /api/auth/mfa/verify` valid OTP -> `200` + access token; wrong OTP -> `400`
  - `POST /api/auth/refresh` without cookie -> `401`
  - `GET /api/datasets` -> `200` list
  - `POST /api/analyse` invalid body -> `400`; valid dataset -> `200`

### 10.2 Frontend tests

- hook tests:
  - `useStreamNames` excludes identity fields
  - `useFilteredData` respects time/id ranges
- auth client tests:
  - `saveAuthSession` stores `accessToken` and `sessionStorage` token
  - `getAccessToken` returns in-memory or stored token
  - `refreshSession` handles `401` (clears session)
- utility tests:
  - correlation returns expected values for known vectors
  - trendline returns deterministic two-point fit
  - variance guard rejects constant arrays
- component tests:
  - login -> OTP -> home navigation flow
  - dashboard conditionally renders sections by stream count
  - `ProtectedRoute` redirects when unauthenticated

### 10.3 Suggested tooling

- Backend: `jest` + `supertest`
- Frontend: `vitest` + `@testing-library/react`
- Data science: `pytest` + fixture-based benchmark regression checks

---

## 11. Performance and Scaling Notes

- PostgreSQL persists wide rows; unique constraint `(dataset_id, entry_id)` makes ingestion idempotent.
- ThingSpeak polling every 15s with 10 results keeps ingestion volume small for demo.
- `O(k^2 * n)` pair computation is fine for small `k`, but should be capped or optimized for many streams
- chart rendering cost grows with point count; downsampling may be needed for long windows
- Analysis latency is benchmarked via Grafana (endpoint performance snapshot: frontend->backend routes and backend->DB query latency) as the baseline for optimization.

---

## 12. Runbook (Developer)

### 12.1 Primary converged path (Docker Compose)

From repository root:

```bash
docker compose up --build -d
docker compose ps
```

Services: `iot-frontend` (`5173`), `iot-backend` (`3000`), `iot-analytics-integration` (`5002`), `iot-db` (`5432`), `iot-prometheus` (`9090`), `iot-grafana` (`3001`, login `admin/admin`), `iot-docker-service-exporter` (`9104`), `iot-mailhog` (`8025`).

Post-source-change note: run `docker compose restart backend` so the backend picks up updated code (bind-mounted nodemon can serve stale code otherwise).

### 12.2 Demo walkthrough

1. Open `http://localhost:5173`, register/login with a valid password (>= 12 chars, upper+lower+digit+special), or use existing account.
2. Login triggers MFA; read the 6-digit OTP from `http://localhost:8025` (MailHog inbox).
3. Enter OTP; verify redirects to `/home`.
4. Dashboard datasets (e.g. `thingspeak-live`) load from PostgreSQL; analysis calls `POST /api/analyse`.
5. Grafana `http://localhost:3001` shows the Engineering Analytics Dashboard with live availability, latency, error-rate, restart, CPU/memory and endpoint-performance panels.

### 12.3 Optional extension paths

- Django DRF: `backend/iot_backend` (`:8000`, model-backed REST extension)
- Flask analytics: `data_science/development/server.py` (research/CSV analytics, not the pilot runtime)

---

## 13. Technical Debt and Next Iteration Backlog

- adopt `/api/v1` namespace after demo freeze
- increase backend unit/integration coverage for auth + dataset flows (current verification is manual/end-to-end)
- expand analytics integration to additional detectors (threshold, LOF, IQR, COPOD) with shared contract
- add structured logging and request IDs for traceability (request IDs exist in envelope; extend to logs)
- role-based UI gating beyond Admin user listing (admin endpoints exist)
- finalize upstream merge of DS benchmark pipeline into analytics integration service tests
- add migration/runbook steps for bootstrapping DB data from canonical processed datasets
- define a single source of truth for dataset/series endpoint naming across file-backed and DB-backed modes
- align DS detector output schema (scores, labels, metadata) with API response contracts for frontend consumption

---

## 14. Definition of Done for LLD Compliance

Implementation is LLD-compliant when:

- module ownership remains consistent with this document
- endpoint contracts and validation behavior match Section 4
- frontend interaction states and correlation logic match Section 5
- canonical record shape and field behavior match Section 6
- test coverage includes critical utility, service, and route behavior
