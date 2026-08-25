# MVP Analytics & Correlation Service Contract Specification

## Overview
This contract defines the reusable data transformation standard between the PostgreSQL database/Express backend and the downstream Analytics services (Correlation Alert API & Anomaly Detection Pipeline). 

It establishes:
1. **Request Payload Standards**: How PostgreSQL `timeseries` rows are formatted into analytics requests.
2. **Response Mapping Standards**: How raw service outputs are normalized for frontend consumption and database persistence (`alerts` and `analytics_results`).
3. **Edge Case & Error Standards**: Standardized handling for empty data, null values, timeouts, and service failures.

---

## 1. Correlation Service Contract (`/detect-correlation-alert`)

### Request Mapping Specification
Transforming PostgreSQL wide-format rows (`timeseries` table) into the Correlation payload structure.

* **Target Endpoint**: `POST /detect-correlation-alert`
* **Transport**: `JSON` / `multipart/form-data`
* **Request Structure**:
```json
{
  "dataset_id": 1,
  "timestamp_col": "created_at",
  "selected_streams": ["field1", "field2", "field3"],
  "window_size": 20,
  "step_size": 10,
  "method": "pearson",
  "data": [
    { "created_at": "2026-08-04T10:00:00Z", "field1": 411.9, "field2": 7.7, "field3": 20.87 },
    { "created_at": "2026-08-04T10:01:00Z", "field1": 412.3, "field2": 7.8, "field3": 20.91 }
  ]
}
```
### Response Mapping Specification
Normalizing raw Python correlation output for frontend display and alerts persistence.
* **Response Structure**:
```json
{
"status": "success",
"summary": {
"processed_rows": 100,
"windows": 9,
"correlation_results": 27,
"changes": 18,
"alerts_count": 2
},
"alerts": [{
"dataset_id": 1,
"entity": "field1_vs_field2",
"rule_name": "Correlation_Drop",
"severity": "HIGH",
"previous_corr": 0.91,
"current_corr": 0.24,
"delta": -0.67,
"reason": "Significant correlation drop detected.",
"triggered_at": "2026-08-04T10:20:00Z"
}],
"analytics_results": [
{
"dataset_id": 1,
"metric_type": "pearson_correlation",
"calculated_value": 0.94,
"stream_1": "field1",
"stream_2": "field2",
"window_start": "2026-08-04T10:00:00Z",
"window_end": "2026-08-04T10:20:00Z"
}]}
```
---

## 2. Anomaly Service Contract

### Request Mapping Specification
Transforming PostgreSQL rows into Anomaly detector parameters.
* **Request Structure**:
```json 
{
"dataset_id": 1,
"metric": "field1",
"model_name": "PcaADDetector",
"timestamps": ["2026-08-04T10:00:00Z", "2026-08-04T10:01:00Z"],
"values": [411.9, 412.3]
}
```

### Response Mapping Specification
Normalizing raw Python correlation output for frontend display and alerts persistence.
* **Response Structure**:
```json 
{
"status": "success",
"summary": {
"processed_rows": 100,
"windows": 9,
"correlation_results": 27,
"changes": 18,
"alerts_count": 2
},
"alerts": [{
"dataset_id": 1,
"entity": "field1_vs_field2",
"rule_name": "Correlation_Drop",
"severity": "HIGH",
"previous_corr": 0.91,
"current_corr": 0.24,
"delta": -0.67,
"reason": "Significant correlation drop detected.",
"triggered_at": "2026-08-04T10:20:00Z"
}],
"analytics_results": [{
"dataset_id": 1,
"metric_type": "pearson_correlation",
"calculated_value": 0.94,
"stream_1": "field1",
"stream_2": "field2",
"window_start": "2026-08-04T10:00:00Z",
"window_end": "2026-08-04T10:20:00Z"
}]}
``` 
--- 
## 3. Failure, Timeout, and Data-Rule Behaviors

| **Scenario**                 | **Behavior / Status Code** | **Response / Handling Standard**                                                                                          |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Empty DB Rows (**[]**)** | HTTP 200 OK                | Returns { "status": "NO_DATA", "alerts": [], "analytics_results": [] }. Pipeline does not crash.                      |
| **Missing / Invalid Metric** | HTTP 400 Bad Request       | Backend validation fails before calling upstream service. Throws "Requested metric does not exist in dataset schema".     |
| **Null Values in Data**      | Auto-Handled               | Missing values are interpolated using linear or previous filling before processing.                                       |
| **Upstream Timeout (>10s)**  | HTTP 504 Gateway Timeout   | Backend catches timeout, logs error, and returns standard error object { "status": "ERROR", "code": "UPSTREAM_TIMEOUT" }. |
| **Upstream 500 Error**       | HTTP 502 Bad Gateway       | Wrapped as { "status": "ERROR", "code": "ANALYTICS_SERVICE_FAILED" }.                                                     |