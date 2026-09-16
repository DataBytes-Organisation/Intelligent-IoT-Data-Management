Correlation API Contract Draft

Project: Intelligent IoT Data Management Prepared by: Thirupathaiah
Miriyala Task: Correlation Change Alert API Documentation Date: 25 July
2026

## 1. Objective

The purpose of this document is to describe the JSON response returned
by the Correlation Alert API after a successful POST request to
/detect-correlation-alert. It documents the request parameters, response
structure, field meanings, and integration considerations for the
Analytics Integration team.

## 2. API Endpoint

  -----------------------------------------------------------------------
  Item                                Value
  ----------------------------------- -----------------------------------
  Method                              POST

  Endpoint                            /detect-correlation-alert

  Purpose                             Processes uploaded CSV sensor data
                                      and detects significant correlation
                                      changes.
  -----------------------------------------------------------------------

## 3. Request Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| file | CSV File | simple.csv | CSV dataset uploaded for processing. |
| selected_streams | String | s1,s2,s3 | Sensor streams to analyse. |
| window_size | Integer | 20 | Sliding window size used for correlation calculation. |
| step_size | Integer | 10 | Sliding window step size. |
| method | String | pearson | Correlation method. Supported values: `pearson` and `spearman`. |
| strong_corr_threshold | Float | 0.7 | Threshold used to classify a correlation as strong. Valid range: `[-1, 1]`. |
| weak_corr_threshold   | Float | 0.4 | Threshold used to classify a correlation as weak. Valid range: `[-1, 1]`. |
| delta_threshold       | Float | 0.3 | Minimum absolute correlation change required for alert detection. Valid range: `[0, 2]`. |
| timestamp_col | String | time | Name of the timestamp column in the uploaded dataset. |

## 4. Response Structure

Top-level JSON response fields returned by the API are:

* status
* request_id
* runtime_ms
* configuration
* summary
* data_quality
* correlations
* changes
* alerts
* skipped_pairs

| Field | Type | Example | Meaning |
|------|------|---------|---------|
| status | String | success | Indicates request completed successfully. |
| request_id | String | f22ed400 | Connects the response to its request log lines. |
| runtime_ms | Integer | 45 | Total request runtime in milliseconds. |
| configuration | Object | {...} | Configuration values used for the correlation analysis. |
| summary | Object | {...} | Overall processing statistics. |
| data_quality | Object | {...} | Counts for preprocessing changes and removed values. |
| correlations | Array | [{...}] | Correlation results for each sliding window. |
| changes | Array | [{...}] | Correlation changes calculated for sliding windows. |
| alerts | Array | [{...}] | Detected correlation alerts. |
| skipped_pairs | Array | [{...}] | Stream pairs skipped because correlation was undefined. |

---

## 5. Changes Object
Each item in the `changes` array contains the following fields.

| Field | Type | Description |
|------|------|-------------|
| window_index | Integer | Sliding window index where the correlation change was detected. |
| start_time | String | Start timestamp of the sliding window. |
| end_time | String | End timestamp of the sliding window. |
| stream_1 | String | First sensor stream. |
| stream_2 | String | Second sensor stream. |
| previous_corr | Float | Correlation value before the detected change. |
| current_corr | Float | Correlation value after the detected change. |
| delta | Float | Absolute difference between previous and current correlation values. |

---

## 6. Alerts Object
Each item in the `alerts` array contains the following fields.

| Field | Type | Description |
|------|------|-------------|
| window_index | Integer | Sliding window index. |
| start_time | String | Start timestamp of the sliding window. ISO 8601 UTC ending in Z, for example `2015-09-01T21:05:00Z`. Datasets whose time column is a plain row counter return that number unchanged instead of a date. |
| end_time | String | End timestamp of the sliding window. Same format as start_time. |
| stream_1 | String | First sensor stream. |
| stream_2 | String | Second sensor stream. |
| previous_corr | Float | Previous correlation value. |
| current_corr | Float | Current correlation value. |
| delta | Float | Correlation difference. |
| alert_level | String | Alert severity (LOW, MEDIUM, HIGH). |
| reason | String | Explanation describing why the alert was generated. |

---


## 7. Correlation Configuration

The API supports configurable correlation analysis parameters so that alert sensitivity can be adjusted without modifying the source code.

| Parameter | Default | Valid Values / Range | Description |
| --------- | ------- | -------------------- | ----------- |
| method | `pearson` | `pearson`, `spearman` | Correlation method used for rolling-window analysis. |
| window_size | `20` | Positive integer | Number of records included in each sliding window. |
| step_size | `10` | Positive integer | Number of records the sliding window advances between calculations. |
| strong_corr_threshold | `0.7` | `[-1, 1]` | Threshold used to identify strong correlation. |
| weak_corr_threshold | `0.4` | `[-1, 1]` | Threshold used to identify weak correlation. Must be less than `strong_corr_threshold`. |
| delta_threshold | `0.3` | `[0, 2]` | Minimum absolute change between correlation values required for change detection. |

---
### 7.1 Configuration Validation

Configuration values are validated before the correlation analysis pipeline is executed.

* `method` must be either `pearson` or `spearman`.
* `window_size` and `step_size` must be positive integers.
* `strong_corr_threshold` and `weak_corr_threshold` must be within `[-1, 1]`.
* `weak_corr_threshold` must be less than `strong_corr_threshold`.
* `delta_threshold` must be within `[0, 2]`.

Invalid caller-supplied configuration returns HTTP `400 Bad Request` instead of an internal HTTP 500 response.


## 8. Supported Severity Values
Current implementation supports the following alert severity levels.

| Severity | Description |
|---------|-------------|
| LOW | Small but significant correlation change. |
| MEDIUM | Moderate correlation change or strong-to-weak / weak-to-strong transition. |
| HIGH | Large correlation change requiring immediate attention. |

---

## 9. Required and Optional Fields
### Required Request Parameters

* file
* timestamp_col
* selected_streams

### Optional Request Parameters

* `window_size`: default `20`
* `step_size`: default `10`
* `method`: default `pearson`; supported values are `pearson` and `spearman`
* `strong_corr_threshold`: default `0.7`; valid range `[-1, 1]`
* `weak_corr_threshold`: default `0.4`; valid range `[-1, 1]` and must be less than `strong_corr_threshold`
* `delta_threshold`: default `0.3`; valid range `[0, 2]`

### Optional Response Fields

* start_time
* end_time

These fields are generated when timestamp information is available in the uploaded dataset.

---

## 10. Error Response
Example error response:

```json
{
  "status": "error",
  "message": "Missing 'timestamp_col'."
}
```
{
  "status": "error",
  "error_type": "invalid_input",
  "message": "'method' must be either 'pearson' or 'spearman'."
}

{
  "status": "error",
  "error_type": "invalid_input",
  "message": "'delta_threshold' must be between 0 and 2."
}


Possible HTTP 400 causes include:

* Missing `timestamp_col`
* Missing `selected_streams`
* Missing uploaded dataset or request data
* Unsupported correlation method
* Non-positive `window_size` or `step_size`
* Correlation thresholds outside `[-1, 1]`
* `weak_corr_threshold` greater than or equal to `strong_corr_threshold`
* `delta_threshold` outside `[0, 2]`


## 11. API Testing Evidence

The Correlation Alert API was tested locally after setting up the
project environment. Both required endpoints were executed successfully
using the provided Postman collection. The GET request confirmed that
the service was running correctly, while the POST request successfully
processed the sample CSV dataset and returned correlation analysis
results.

### Figure 1. Successful GET /service-status request

![GET Service Status](evidence/postman_get_service_status.png)

### Figure 2. Successful POST /detect-correlation-alert request

![POST Detect Correlation Alert](evidence/postman_post_detect_correlation_alert.png)

### Figure 3. Flask Server Terminal

![Flask Server Terminal](evidence/flask_server_terminal.png)

## 12. Alert Object Fields

  Field           Type      Example                  Description
  --------------- --------- ------------------------ ---------------------------------------
  alert_level     String    HIGH                     Severity of alert
  stream_1        String    s1                       First sensor stream
  stream_2        String    s2                       Second sensor stream
  previous_corr   Number    -0.9466                  Previous correlation value
  current_corr    Number    0.6852                   Current correlation value
  delta           Number    1.6319                   Difference between correlation values
  window_index    Integer   15                       Sliding window index
  start_time      String    2015-09-01T21:05:00Z     Window start time, ISO 8601 UTC
  end_time        String    2015-09-02T06:30:00Z     Window end time, ISO 8601 UTC
  reason          String    Correlation changed...   Reason for alert

The alert object carries exactly the ten fields above. It does not include
`method`, `window_size`, `step_size`, `strong_corr_threshold`,
`weak_corr_threshold`, or `delta_threshold`. These values are request-level
configuration parameters and are returned in the top-level `configuration`
object rather than repeated on each alert.

## 13. Summary Object

  Field                 Observed Value
  --------------------- ----------------
  alerts                16
  changes               294
  processed_rows        1008
  windows               99
  correlation_results   99

## 14. Sample JSON Response (Excerpt)

{ "status": "success", "summary": { "alerts": 16, "changes": 294,
"correlation_results": 99, "processed_rows": 1008, "windows": 99 } }

## 15. Integration Notes

Verify the status field before processing results.

Alerts contains significant correlation events.

Changes contains calculated correlation changes.

Summary provides overall processing statistics.

Client applications should handle empty alerts arrays gracefully.

## 16. Questions for Analytics Integration Team

Should every alert include a unique alert_id?

Why are start_time and end_time shown as placeholder timestamps in the
current response? Answered. The time column was forced through
pd.to_numeric, so any real date became NaN. Datasets with real timestamps
now return ISO 8601 UTC. A dataset whose time column is a plain row counter
still has no date to report and returns the counter value.

What is the intended difference between correlation_results and windows?

Should error responses follow a standard JSON schema?

## 17. Setup Issues & Fix

Issue: While testing the POST /detect-correlation-alert endpoint in
Postman, the request initially returned HTTP 415 Unsupported Media Type
and HTTP 500 Internal Server Error.

Cause: The CSV file was not uploaded correctly because the file field in
the Postman form-data request was configured incorrectly.

Fix: The file field was changed to the File type, simple.csv was
uploaded correctly, and the request was sent again. The API then
processed the dataset successfully and returned HTTP 200 OK.
