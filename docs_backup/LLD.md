# Low Level Design (LLD) - Intelligent IoT Data Management

## 1. Purpose and Scope

This document defines code-level behavior for the current converged runtime path:

- Frontend: `new-frontend/frontend`
- Backend API: `newBackend/BackendCode`
- Optional analytics assets: `data_science/algorithms`
- Optional extension backend: `backend/iot_backend` (Django DRF)

Repository sync note (2026-05-14): this LLD reflects latest merged team contributions currently present in the monorepo, including the parallel `frontend` app and Dockerized Django stack assets.

The goal is to provide implementation-ready detail for API contracts, module responsibilities, runtime flow, algorithms, testing, and operational behavior.

---

## 2. Runtime Topology and Ports

### 2.1 Primary runtime (current)

- Browser -> React/Vite app (`new-frontend/frontend`)
- React app -> Node/Express API (`newBackend/BackendCode`)
- Node API -> local JSON repository (`BackendCode/mock_data/processed_data.json`)

### 2.2 Port map

- Frontend dev server: `5173` (or another Vite port)
- Backend API: `3000` (`PORT` env or default)
- Optional Flask analytics: `5000`
- Optional Django backend: `8000`

---

## 3. Source-Level Module Map

## 3.1 Frontend module ownership (`new-frontend/frontend/src`)

- `pages/`: route pages (`Login`, `RegistrationPage`, `ForgotPassword`, `HomePage`, `DashboardPage`)
- `components/`: rendering and interaction units (selectors, charts, stats, correlation cards, shared layout/navbar/footer, dataset card, route guard)
- `hooks/`: data loading and filtering logic
- `utils/`: math and helper logic (correlation, variance, trendline)
- `data/`: mock datasets for offline mode
- `services/`: auth integration seam (`authClient.js`)

### 3.2 Backend module ownership (`newBackend/BackendCode`)

- `server.js`: Express bootstrap and middleware registration
- `routes/mock.js`: endpoint to controller mapping
- `controllers/mockController.js`: request validation and HTTP response shaping
- `services/mockService.js`: business logic for stream discovery and filtering
- `repositories/mockRepository.js`: file-based data access
- `middleware/`: request guards (JWT verification middleware from PR #70)
- `utils/`: helper utilities for token and hashing workflows (PR #70)
- `config/`: auth-related configuration seam (PR #70)

---

## 4. Backend LLD (Node/Express)

### 4.1 Boot sequence

Files: `newBackend/BackendCode/app.js`, `newBackend/BackendCode/server.js`

1. `app.js` loads env from `../.env`
2. `app.js` creates Express app
3. `app.js` registers middleware:
   - `cors()`
   - `express.json()`
4. `app.js` registers root and health routes (`GET /`, `GET /health`)
5. `app.js` mounts API routes under `/api`
6. `server.js` imports app and binds server to `PORT` (default `3000`)

### 4.2 Environment contract

File: `newBackend/.env`

- `PROCESSED_DATA_PATH`: path to JSON dataset used by repository
- `PORT` (optional): backend port override

Current expected path example:

```env
PROCESSED_DATA_PATH=./mock_data/processed_data.json
```

Note: backend should be started from `newBackend/BackendCode` so this relative path resolves correctly.

### 4.3 API endpoint definitions

Base: `/api`

#### `GET /health` (service-level)

- Purpose: backend readiness/liveness signal for operational checks
- Location: app-level route in `newBackend/BackendCode/app.js`
- Status: implemented and covered by smoke test `GET /health returns service health payload`
- Success: `200` with JSON payload

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptimeSeconds": 123.45
}
```

#### `GET /api/streams`

- Purpose: return all processed entries
- Controller: `getStreams`
- Service: `readProcessedData`
- Success: `200` with JSON array of records
- Failure: `500` with `{ "error": "Failed to load stream data" }`

#### `GET /api/stream-names`

- Purpose: derive stream keys from dataset first row
- Excludes: `created_at`, `entry_id`, `was_interpolated`
- Controller: `getStreamNames`
- Service: `getAvailableStreamNames`
- Success: `200` with string array
- No data: `404` with `{ "error": "No stream names found" }`
- Failure: `500` with `{ "error": "Failed to get stream names" }`

#### `POST /api/filter-streams`

- Purpose: return only requested streams plus identity fields
- Request body:

```json
{
  "streamNames": ["Temperature", "Voltage Charge"]
}
```

- Validation:
  - `streamNames` must be a non-empty array
  - invalid payload returns `400`
- Success: `200` with filtered record array
- Failure: `500` with `{ "error": "Failed to filter stream data" }`

#### `GET /api/data-profile`

- Purpose: lightweight dataset quality/profile summary for analytics readiness
- Controller: `getDataProfileSummary`
- Service: `getDataProfile`
- Success: `200` with profile payload containing:
  - `rowCount`
  - `streamCount`
  - `streams[]` with `missingPercent`, `min`, `max`, `mean`
  - `timeRange.start`, `timeRange.end`
- Failure: `500` with `{ "error": "Failed to profile stream data" }`

#### `POST /api/top-correlated-pair`

- Purpose: return strongest correlated pair among provided stream names
- Request body:

```json
{
  "streamNames": ["Temperature", "Humidity", "Voltage Charge"]
}
```

- Validation:
  - `streamNames` must be an array with at least two items
  - invalid payload returns `400`
- Success: `200` with:
  - `pair` (2 stream names)
  - `correlation`
  - `sampleSize`
  - `label` (`strong`, `moderate`, `weak`, `insufficient-data`)
- Compute failure (no usable pair): `422`
- Internal error: `500`

### 4.4 Layer logic details

#### Repository: `mockRepository.js`

- Resolves `this.filePath = path.resolve(process.env.PROCESSED_DATA_PATH)`
- Reads file synchronously using `fs.readFileSync`
- Parses JSON and returns array
- Throws on file/path/parse issues

#### Service: `mockService.js`

- `readProcessedData()`: pass-through full dataset
- `getAvailableStreamNames()`:
  - reads dataset
  - returns `[]` if empty
  - removes metadata keys
- `filterEntriesByStreamNames(streamNames)`:
  - keeps `created_at` and `entry_id`
  - conditionally adds each requested stream if key exists
- `getDataProfile()`:
  - computes dataset-level summary and per-stream quality metrics
  - outputs counts, missing rates, and basic descriptive statistics
- `getTopCorrelatedPair(streamNames)`:
  - computes pairwise Pearson correlation for selected valid streams
  - returns highest absolute correlation pair and interpretation label

#### Controller: `mockController.js`

- wraps service calls in `try/catch`
- performs payload validation for `POST /filter-streams`
- performs payload validation for `POST /api/top-correlated-pair`
- returns HTTP-safe error messages

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
- `Layout` composes shared `Navbar` and `Footer` around protected content.
- `DashboardPage` renders `Dashboard` feature composition.
- Dashboard contains selection controls, charting, stats, and correlation insights.

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

### 5.5 Known implementation notes

- Current dashboard runs in mock mode: `useSensorData(true)`
- UI text mentions rolling correlation, but active code currently renders static pairwise correlation and trendline only
- Auth flow and protected-route shell are now implemented at router level (PR #71), but final token/session contract must be aligned with backend APIs.

---

## 6. Data Model and Contract

### 6.1 Canonical record

```json
{
  "created_at": "2025-03-19T15:01:59.000Z",
  "entry_id": 3242057,
  "Temperature": 22.0,
  "RH Humidity": 41.0,
  "Voltage Charge": 12.5,
  "was_interpolated": false
}
```

### 6.2 Field semantics

- `created_at`: ISO timestamp string, source event time
- `entry_id`: monotonically increasing source identifier
- dynamic stream fields: sensor numeric values
- `was_interpolated`: optional preprocessing marker

### 6.3 Data validation expectations

- all output records must include `created_at`, `entry_id`
- selected stream keys should be preserved exactly (case and spacing)
- missing stream values should be omitted or set `null` consistently per endpoint policy

---

## 7. Low-Level Sequence Flows

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

---

## 8. Error Handling and Resilience

### 8.1 Backend

- repository exceptions are translated to `500`
- invalid filtering payload produces `400`
- empty stream catalog returns `404`
- auth middleware path returns `401` when token is missing
- auth middleware path returns `403` when token is invalid/verification fails

### 8.2 Frontend

- hook-level loading and error states are surfaced in dashboard
- when variance is insufficient, component returns explanatory text instead of chart

### 8.3 Operational guardrails

- ensure `.env` path is valid before startup
- verify dataset file exists and is parseable JSON
- keep mock mode enabled for offline/demo fallback

---

## 9. Optional Multi-Backend Integration Details

This repo includes two additional service paths:

- Flask analytics service: `data_science/development/server.py` (`:5000`)
- Django DRF service: `backend/iot_backend` (`:8000`)

### 9.1 Why they are separate currently

- Flask path targets algorithm experimentation and CSV upload analytics
- Django path targets REST resource modeling and persistence-ready APIs
- primary Node path is lightweight demo API over local processed JSON

### 9.1.1 DB implementation stream (fork reference)

- External fork commit history (`FarrisBaboo/main`) shows a DB-first implementation stream with ingestion and endpoint updates:
  - `5e04d8e` ingestion logic + models
  - `89e7d28` DB controllers/service/repository + ingest fix
  - `bffcaba` mock-to-DB connection fix
  - `c92a28f` ingestion pipeline and dataset/series endpoint update

Low-level implication:

- LLD should model two repository strategies:
  - `FileRepository` (current local runtime in this workspace)
  - `DbRepository` (integration path demonstrated in DB stream)
- Controller/service contracts should remain stable so repository implementation can be swapped without route-level refactor.

### 9.4 Backend auth stream note (PR #70)

- Merged backend PR adds lightweight authentication primitives (bcrypt, JWT, middleware) to the Node codebase lineage.
- LLD implication: endpoint contracts should now classify routes as `public` vs `protected` and enforce `Authorization: Bearer <token>` on protected operations.
- Integration step pending: align frontend auth client calls with backend token issuance/verification endpoints and standardized error payloads.

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

### 9.2 Contract mismatch to note

- `frontend/src/AnalyzePanel.jsx` calls `POST http://localhost:5000/api/analyze`
- Flask server currently exposes `POST /analyze` (no `/api` prefix)
- Flask expects multipart form-data with file upload, while frontend currently sends JSON

### 9.3 Additional frontend track note

- `frontend/src/App.jsx` includes `Login`, `Register`, and `AnalyzePanel` routes and MUI-based theme switching.
- `new-frontend/frontend` now also includes a full auth + protected-layout route structure after PR #71.
- For convergence, keep `new-frontend/frontend` as primary runtime UI path and treat `frontend` as adjacent/legacy path unless team explicitly consolidates.

---

## 10. Testing Strategy (Low-Level)

### 10.1 Backend unit/integration tests

- repository test:
  - valid file path returns parsed array
  - invalid path throws controlled error
- service test:
  - stream discovery excludes metadata keys
  - filtering returns requested stream subset only
- route test:
  - `GET /` -> `200` and status text
  - `GET /health` -> `200` and health payload
  - `GET /api/stream-names` -> `200` and non-empty stream array
  - `POST /api/filter-streams` with invalid body -> `400`
  - `GET /api/data-profile` -> `200` and profile payload
  - `POST /api/top-correlated-pair` valid payload -> `200`
  - `POST /api/top-correlated-pair` short list payload -> `400`

### 10.2 Frontend tests

- hook tests:
  - `useStreamNames` excludes identity fields
  - `useFilteredData` respects time/id ranges
- utility tests:
  - correlation returns expected values for known vectors
  - trendline returns deterministic two-point fit
  - variance guard rejects constant arrays
- component tests:
  - dashboard conditionally renders sections by stream count

### 10.3 Suggested tooling

- Backend: `jest` + `supertest`
- Frontend: `vitest` + `@testing-library/react`
- Data science: `pytest` + fixture-based benchmark regression checks

---

## 11. Performance and Scaling Notes

- file-backed repository reads full JSON per request; acceptable for demo-sized datasets
- for larger datasets, move to in-memory cache with invalidation or DB-backed pagination
- `O(k^2 * n)` pair computation is fine for small `k`, but should be capped or optimized for many streams
- chart rendering cost grows with point count; downsampling may be needed for long windows

---

## 12. Runbook (Developer)

### 12.1 Primary converged path

Backend:

```bash
cd newBackend
npm install
cd BackendCode
node server.js
```

Frontend:

```bash
cd new-frontend/frontend
npm install
npm run dev
```

### 12.2 Optional analytics path

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install flask pandas numpy matplotlib seaborn
python data_science/development/server.py
```

---

## 13. Technical Debt and Next Iteration Backlog

- standardize response envelope across all endpoints
- align frontend live endpoint path with backend (`/api/streams` or `/api/sensor-data` alias)
- unify correlation logic in one service contract (frontend util vs Python analytics)
- implement rolling correlation backend or frontend utility to match dashboard text
- add structured logging and request IDs for traceability
- complete upstream merge of DB ingestion stream and document concrete DB schema/ORM model map
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
