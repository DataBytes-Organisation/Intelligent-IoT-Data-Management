# V1 Live API Surface — Contract (AFI-05)

**Status:** Draft for review
**Owner:** Pau
**Related:** AFI-01 (baseline), AFI-02 (mock audit), AFI-06 (widget mapping), BE-API-Contract.docx (auth-specific contract)

Status legend used below:
- **STABLE V1** — ready for FE to build against now
- **TRANSITIONAL** — mock/local-data route, not backed by live ingestion, not part of V1
- **NOT READY** — blocked on other work, do not treat as a contract yet

## Scope

Datasets currently verified against live ingestion:
- `thingspeak-live` — live ThingSpeak channel 12397 feed, polled and stored via `thingSpeakInjest.js` / `thingspeakService.js`
- `1350261` — CSV-ingested dataset (channel 1350261)

`2881821` and `3036461` follow the same CSV-ingestion shape but are **not yet marked verified** — add them to `mvp-tracker.md` once confirmed end-to-end.

---

## 1. Datasets

### `GET /api/datasets` — STABLE V1
List all known datasets.
**Auth:** none currently enforced — confirm before FE cutover (see Open Items).
**Response 200**
```json
[
  { "id": 1, "name": "thingspeak-live" },
  { "id": 2, "name": "1350261" }
]
```
**Response 500**: `{ "error": "Failed to load datasets" }`

### `GET /api/datasets/:id` — STABLE V1
**Path param:** `id` (integer)
**Response 200**: `{ "id": 1, "name": "thingspeak-live" }`
**Response 404**: `{ "error": "Dataset not found" }`
**Response 500**: `{ "error": "Failed to load dataset" }`

### `POST /api/datasets` — NOT PART OF STABLE FE SURFACE
Per the existing code comment (`datasetsController.js`), dataset creation is disabled at the API level — datasets are created automatically by the ingestion pipelines (CSV or ThingSpeak), not by client request. Recommend removing this from the FE-facing route table, or explicitly gating it behind an internal/admin-only flag if it needs to stay mounted.

---

## 2. Series (wide-format time-series)

### `GET /api/datasets/:name/series` — STABLE V1
**Path param:** `name` — one of `thingspeak-live`, `1350261` (V1-verified)
**Response 200**: array of wide-format entries.

Example (`thingspeak-live`):
```json
[
  { "created_at": "2026-04-18T08:00:00Z", "entry_id": 1, "field1": 24.5, "field2": 61.2 }
]
```

> **Note:** field names are whatever the ingestion pipeline stored — ThingSpeak-origin datasets use `field1`..`field8`; CSV-origin datasets use the CSV's own column names (e.g. `s1`, `s2`, `Temperature`). FE must not assume a fixed field set. Until a dedicated "list fields for this dataset" endpoint exists, FE should read the keys off the first returned row.

**Response 404**: `{ "error": "Dataset not found or empty" }`
**Response 500**: `{ "error": "Failed to load series" }`

### `POST /api/datasets/:name/series/filter` — STABLE V1
**Body:** `{ "streamNames": ["field1", "field2"] }`
**Response 200**: filtered wide entries, same shape as above, restricted to requested fields plus `created_at`/`entry_id`.
**Response 400**: `{ "error": "streamNames must be a non-empty array" }`
**Response 404 / 500**: as above

---

## 3. Timestamps

### `GET /api/datasets/:name/timestamps` — STABLE V1
**Response 200**: `["2026-04-18T08:00:00Z", "2026-04-18T08:05:00Z"]`
**Response 404 / 500**: as above

---

## 4. Authentication — STABLE V1, with known gaps

`POST /api/register`, `POST /api/login`, `POST /api/refresh-token`, `POST /api/logout`, `GET /api/admin/users` (auth + admin role required).

Full field-level contract lives in `BE-API-Contract.docx`. Known deviations between that contract and the current implementation, carried forward from the earlier review — **do not close this item until these are resolved or the contract is updated to match reality:**
1. Identity field is `username` in the running backend; the contract specifies `email` as the sole identity field.
2. Refresh token is returned as a plain JSON field (`refreshToken`); the contract specifies an HttpOnly `iot_refresh` cookie.
3. No `error.code` is returned on auth failures; the contract requires a stable machine code on every error.

---

## 5. Analytics & Alerts

`POST /api/analyse` is implemented and calls the analytics service — confirmed live, not just by PR review. Previously documented here as placeholder-only; corrected after real testing. Request body requires `dataset` (name string, not numeric id), `model` (object, requires `model.metric` as a non-empty canonical metric name), and `correlation` (object, requires `correlation.streams` as an array of 2+ canonical metric names). Once validation passes, the call reaches out to the analytics service — in this test the service itself returned `503 ANALYTICS_UNAVAILABLE`, so the success-path response shape is still unconfirmed. See `evidence/api-samples.json` for the full request/response.

"Latest alerts" and "alert history" routes — **NOT READY, do not exist in the codebase yet.** Per the AFI-05 task instructions, these stay out of scope until BDAI-10 and BDAI-11 deliver implementation and evidence. Do not declare them stable in this pass.

---

## 6. Transitional / mock-first routes — NOT part of V1 live surface

These read from the local mock JSON-backed repository, not live ingested data:
- `GET /api/streams`
- `GET /api/stream-names`
- `POST /api/filter-streams`
- `GET /api/data-profile`
- `POST /api/top-correlated-pair`

FE should treat these as temporary scaffolding only. New widget work should target the `/api/datasets/:name/...` routes above instead. Existing usage should be migrated as part of the live-data cutover (AFI-11 / AFI-15), not extended.

---

## 7. Standard error response format (proposed, not yet implemented)

The current backend returns a flat shape, e.g. `{ "error": "Dataset not found" }`, with no machine-readable code. Recommended V1 standard for all STABLE routes above:

```json
{ "error": { "code": "DATASET_NOT_FOUND", "message": "Dataset not found or empty" } }
```

This is a breaking change from the current response shape and needs a BE implementation pass before this item can be marked done — track it as follow-up work, not as already satisfied by this document.

---

## 8. Frontend audit findings (completed)

Full FE source (`pages/`, `components/`, `hooks/`) was reviewed against this contract. Summary:

| Area | Current behaviour | Calls backend? |
|---|---|---|
| Login | Reads/writes `localStorage` (`registeredUser`, `isAuthenticated`); fake OTP step | No |
| Registration | Writes `{ fullName, email, password }` — **plaintext password** — to `localStorage.registeredUser` | No |
| Forgot Password | Calls `POST /api/auth/forgot-password` | Yes — **route does not exist** on the backend |
| Route guard (`ProtectedRoute.jsx`) | Checks `localStorage.isAuthenticated` / `sessionStorage.iot_auth` flags set by Login | No |
| Home (dataset list) | Hardcoded array (`sensor1`, `sensor2`, `sensor3`) — names don't match real dataset names (`thingspeak-live`, `1350261`, etc.) | No |
| Dashboard (`Dashboard.jsx`) | Calls `useSensorData(true, ...)` — the `true` hardcodes mock mode, so it loads a static bundled file (`src/data/sensorData1.json`) and never reaches the `fetch('/api/streams')` branch in the hook | No — not even hitting the transitional mock route |
| Dashboard routing | `DashboardPage.jsx` passes `datasetId={id}` from the `/dashboard/:id` URL, but `Dashboard.jsx` never accepts or uses a `datasetId` prop | N/A — dead prop, dashboard shows the same static data regardless of which dataset card was clicked |

**Net finding: the frontend does not currently call the live backend anywhere.** Auth is entirely client-side/fake, and the dashboard reads a bundled static file rather than even the transitional mock API. This means the live-data cutover (AFI-11/AFI-15) has more surface area than "swap mock routes for live routes" — it also requires:
- Wiring `useSensorData` to actually fetch (remove the hardcoded `useMock = true`, or thread a real toggle through)
- Wiring `Dashboard.jsx` to accept and use the `datasetId` from the URL, and call `/api/datasets/:name/series` (or `.../timestamps`) instead of a flat `/api/streams` call
- Replacing the client-side login/registration/route-guard logic with real calls to `/api/login`, `/api/register`, and token-based route protection
- Either implementing `/api/auth/forgot-password` on the backend or removing/re-scoping the Forgot Password flow — it currently calls a route that returns a 404

## 9. Live evidence findings (captured, not derived)

Real requests were run against a live local instance (Postgres `IoTDatabase`, ThingSpeak polling confirmed working for channel 12397 / `thingspeak-live`). Full samples in `evidence/api-samples.json`. Two findings that change earlier open items:

- **`GET /api/datasets/:name/series` returns an undocumented `dataset_id` field on every row.** Not mentioned in §2's example shape — the example there should be corrected to include it.
- **Canonical metric names may already exist for ThingSpeak-origin datasets, unused.** `GET /api/feeds`'s `channel` object returns real, human-readable labels for all 8 fields directly from ThingSpeak (e.g. `field3: "% Humidity"`, `field4: "Temperature (F)"`). This is a live, ready-made name mapping — it answers part of Open Item 3 (canonical metric naming) for ThingSpeak-origin data specifically. It does **not** help for CSV-origin datasets (`1350261` etc.), which have no equivalent metadata source.
- **Unit mismatch discovered:** `field4` (temperature) is in **Fahrenheit** at the ThingSpeak source, but `/api/feeds`'s cleaned response returns it unlabeled as `temperature` with no unit — easy to misread as Celsius. Feeds into Open Item 4 (units).
- **`/api/feeds` only surfaces 3 of the channel's 8 real fields** (temperature, humidity, pressure) — wind direction, wind speed, rain, power level, and light intensity exist in the raw channel but aren't in the cleaned response at all.

## Known local-setup issues (worth noting for the team / onboarding docs)

Getting a local instance running surfaced three real friction points, likely to hit anyone else setting this up fresh:
1. Postgres service not running by default — no error until the first DB-backed route is hit.
2. Target database (`IoTDatabase`) doesn't exist until manually created — `schema.sql` also isn't auto-run.
3. **`JWT_SECRET` is missing from the example `.env` and has no fallback in `tokenUtils.js`**, while `authService.js` *does* have a fallback (`"dev_secret_key"`). Net effect: login silently succeeds and signs a token, but every protected route (`authMiddleware.js` → `jwt.verify`) fails with a misleading "Invalid or expired token" — the real cause (missing env var) is never surfaced. Worth fixing the fallback mismatch and/or documenting `JWT_SECRET` as required in `.env.example`.

## Open items to resolve before "Contract reviewed" is signed off

1. ~~Frontend call inventory~~ — **done, see §8.**
2. Auth contract gaps (§4) — resolve or explicitly re-scope before FE treats auth as final V1. Now compounded by §8: FE isn't calling real auth at all yet, so this is a full implementation task on both sides, not just a contract fix.
3. Decide whether `GET /api/datasets` needs auth in V1 or stays public.
4. Implement the standard error envelope (§7) across all stable routes.
5. Decide how to handle `/api/auth/forgot-password` — implement it, or have FE stop calling it until it's scoped (see §8).
6. Fix the `datasetId` wiring gap between `DashboardPage.jsx` and `Dashboard.jsx` before live cutover — otherwise every dataset dashboard will show the same data.
7. Add `dataset_id` to the documented `/series` response shape (§9).
8. Decide whether to adopt ThingSpeak's channel field labels as the canonical metric-name source for ThingSpeak-origin datasets, and find an equivalent for CSV-origin datasets (§9).
9. Resolve the temperature unit mismatch (°F vs. unlabeled) on `/api/feeds`, and decide whether the other 5 unexposed fields should be added (§9).
10. Fix the `JWT_SECRET` fallback mismatch between `authService.js` and `tokenUtils.js` — currently silently breaks all protected routes with a misleading error.
11. ~~Two 404 error cases~~ — **done, all 9 planned samples in `evidence/api-samples.json` are now captured live, none fabricated.**
12. Schedule the cross-team review (FE, BE, Analytics, Architecture) once items 2–10 are addressed — this document is not "reviewed" until that happens.
