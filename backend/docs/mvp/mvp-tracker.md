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
