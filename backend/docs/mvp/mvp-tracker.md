# Schema Gap Analysis
### Identified Persistence Gaps
While telemetry and dataset tables (`datasets`, `timeseries_long`, `timeseries`) exist in `backend/src/db/schema.sql`, persistence structures for alert triggers and analytical computations are currently missing:

1. **Alert Persistence Table (`alerts`)**:
   * Status: Missing
   * Requirement: Needed to record threshold breaches and correlation alert events.
   * Proposed Structure: `id` (SERIAL PK), `dataset_id` (FK), `entity` (TEXT), `rule_name` (TEXT), `severity` (TEXT), `triggered_at` (TIMESTAMPTZ), `resolved_at` (TIMESTAMPTZ).

2. **Analytics Results Table (`analytics_results`)**:
   * Status: Missing
   * Requirement: Needed to store pre-aggregated metrics, trend computations, and output models from data science algorithms.
   * Proposed Structure: `id` (SERIAL PK), `dataset_id` (FK), `metric_type` (TEXT), `calculated_value` (DOUBLE PRECISION), `window_start` (TIMESTAMP), `window_end` (TIMESTAMP), `created_at` (TIMESTAMPTZ).

---

### Mapping Notes
* **Contract Specification**: `backend/docs/mvp/analytics-contract.md`
* **API Sample Evidence**: `backend/docs/mvp/evidence/api-samples.json`
* **Transformation Mappers**: `backend/src/services/analyticsMapper.js`
* **Unit Tests**: `backend/test/analyticsMapper.test.js`

#### Implemented Transformation Assumptions & Rules
1. **Payload Generation**:
   * Pure functions map PostgreSQL `timeseries` rows directly into request payloads for Correlation (`/detect-correlation-alert`) and Anomaly services.
   * Handles numeric conversion and missing values gracefully before passing data downstream.

2. **Response Normalization**:
   * Upstream Python service outputs are standardized into normalized JSON structures ready for database insertion into the planned `alerts` and `analytics_results` tables, as well as frontend rendering.

3. **Edge Case & Error Handling**:
   * **Empty Data (`[]`)**: Returns a standardized `{ status: "NO_DATA", alerts: [], analytics_results: [] }` response without throwing runtime exceptions.
   * **Validation Errors**: Fails early with HTTP 400 structures if `dataset_id` or requested metrics are invalid/missing.
   * **Upstream Timeout / Service Failures**: Wraps external service failures cleanly into standardized error codes (`UPSTREAM_TIMEOUT`, `ANALYTICS_SERVICE_FAILED`).