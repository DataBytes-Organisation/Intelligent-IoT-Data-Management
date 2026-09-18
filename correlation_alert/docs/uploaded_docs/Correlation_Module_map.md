# Correlation Module Map & Hardcoded-Logic Audit

**Task:** CCA107 (Week 3)
**Owner:** Tommy Nguyen — Junior Lead, Correlation sub-team
**Scope:** `correlation_alert/`
**Commit audited:** `main` @ `a81b394`
**Date:** 27 July 2026

---

## 1. Purpose

This document does two things:

1. Maps what each module in `correlation_alert/` takes in and puts out, so the team stops guessing how the inherited pipeline fits together.
2. Lists every hardcoded value that must become configurable, with `file:line`, so CCA113 has a concrete work list.

---

## 2. Note on actual repository structure

The Week 3 task sheet refers to folders `preprocessing/`, `rolling_window/`, `correlation/` and `alert_generation/`. **These folders do not exist.** The inherited code is four flat Python files:

```
correlation_alert/
├── server.py            108 lines   Flask API layer
├── main.py              341 lines   entire pipeline (window + correlation + alerting)
├── preprocessing.py     164 lines   data cleaning helpers
├── final_pipeline.py     49 lines   manual test client, not part of the service
├── IIoDT.postman_collection.json    Postman collection
├── README.md
├── docs/
└── testing/
```

The four logical stages the task sheet names all live **inside `main.py`** as separate functions. This is the first structural finding: there is no module boundary between rolling-window, correlation and alert-generation, which is why the pipeline is hard to modify safely.

---

## 3. Module map — input → output

### 3.1 `server.py` — API layer

| Endpoint | Method | Input | Output |
|---|---|---|---|
| `/service-status` | GET | none | `{status, message, service}` |
| `/detect-correlation-alert` | POST | CSV upload (multipart) **or** JSON body | `{status, summary, correlations, alerts, changes}` |

**Input contract for `/detect-correlation-alert`:**

| Field | Type | Required | Default |
|---|---|---|---|
| `data` | list of row objects | required (JSON mode only) | — |
| `file` | CSV file | required (multipart mode only) | — |
| `timestamp_col` | string | **yes** — 400 if missing | none |
| `selected_streams` | list of strings / comma string | **yes** — 400 if missing | none |
| `window_size` | int | no | `30` |
| `step_size` | int | no | `5` |
| `method` | string | no | `"pearson"` |

**Flow:** `server.py` only parses the request and delegates everything to `main.detect_correlation_change_alert()`. It does no analysis of its own.

**Output shape:**

```
status              : "success" | "error"
summary             : {processed_rows, windows, correlation_results, changes, alerts}
correlations[]      : {window_index, start_time, end_time, window_size, correlation_matrix}
alerts[]            : {window_index, start_time, end_time, stream_1, stream_2,
                       previous_corr, current_corr, delta, alert_level, reason}
changes[]           : same as alerts minus alert_level and reason
```

---

### 3.2 `main.py` — pipeline

`detect_correlation_change_alert()` (line 284) is the single entry point. It chains five stages:

```
raw DataFrame
   │
   ▼  preprocess_timeseries()                     main.py:15
       ├─ selects [timestamp_col] + selected_streams
       ├─ delegates to preprocessing.py helpers
       └─ sets timestamp as DatetimeIndex
   │
   ▼  DataFrame indexed by timestamp
   │
   ▼  create_rolling_windows()                    main.py:72
       └─ slices df.iloc[start:end] stepping by step_size
   │
   ▼  list[DataFrame]  (one per window)
   │
   ▼  compute_window_correlations()               main.py:100
       └─ window_df.corr(method=...) per window
   │
   ▼  list[{window_index, start_time, end_time, window_size, correlation_matrix}]
   │
   ▼  compare_correlation_changes()               main.py:153
       └─ for each consecutive window pair, for each stream pair:
          delta = abs(current_corr − previous_corr)
   │
   ▼  list[changes]
   │
   ▼  generate_alerts()                           main.py:218
       └─ applies threshold rules, calls create_alert()   main.py:266
   │
   ▼  list[alerts]
```

**Stage detail:**

| Function | Line | Input | Output |
|---|---|---|---|
| `preprocess_timeseries` | 15 | raw df, timestamp_col, selected_streams | df indexed by datetime, no NaN |
| `create_rolling_windows` | 72 | preprocessed df, window_size, step_size | `list[DataFrame]` |
| `compute_window_correlations` | 100 | list of windows, method | list of dicts with correlation matrix |
| `compare_correlation_changes` | 153 | correlation results | list of per-pair delta records |
| `get_alert_level` | 196 | `delta_r` float | `None`/`LOW`/`MEDIUM`/`HIGH` |
| `generate_alerts` | 218 | changes + 3 thresholds | list of alert dicts |
| `create_alert` | 266 | change, level, reason | single alert dict |
| `detect_correlation_change_alert` | 284 | everything above | dict of all 5 intermediate outputs |

---

### 3.3 `preprocessing.py` — cleaning helpers

Called from `main.preprocess_timeseries()`. Each function takes a DataFrame and returns a DataFrame.

| Function | Line | What it does |
|---|---|---|
| `load_sensor_data` | 5 | reads CSV, strips column whitespace, **requires a `time` column** |
| `fix_timestamps` | 17 | coerces time to numeric, drops invalid + duplicate timestamps, sorts |
| `convert_sensor_columns_to_numeric` | 38 | coerces every non-time column to numeric |
| `handle_missing_values` | 49 | `interpolate` / `ffill` / `drop` |
| `remove_outliers` | 68 | IQR rule, replaces outliers with NaN then interpolates |
| `align_to_common_index` | 99 | reindexes to a continuous integer time range |
| `validate_output` | 117 | raises if unsorted or NaN remain; casts to float64 |
| `run_pipeline` | 135 | standalone CSV-to-CSV script, **not used by the API** |

⚠️ `align_to_common_index()` is **never called** by the API path — only inside `run_pipeline()`. The service therefore does not guarantee an evenly spaced time index, even though the rolling window logic assumes rows are evenly spaced.

---

### 3.4 `final_pipeline.py` — manual test client

Not part of the running service. A script that reads `../datasets/complex.csv` and POSTs it to a locally running server. Useful as a smoke test; hardcodes the dataset, stream names, and parameters.

---

## 4. Hardcoded values that must become configurable

Ranked by impact on CCA113.

### 4.1 Severity thresholds — highest priority

| # | Value | Meaning | Location |
|---|---|---|---|
| 1 | `0.3` | delta below this → no alert | `main.py:209` |
| 2 | `0.5` | LOW / MEDIUM boundary | `main.py:211` |
| 3 | `0.7` | MEDIUM / HIGH boundary | `main.py:213` |
| 4 | `strong_corr_threshold=0.7` | "strong correlation" cutoff | `main.py:218` |
| 5 | `weak_corr_threshold=0.4` | "weak correlation" cutoff | `main.py:218` |
| 6 | `delta_threshold=0.3` | minimum delta to raise an alert | `main.py:218` |
| 7 | `0.5` | LOW / MEDIUM boundary, **duplicated** | `main.py:247` |
| 8 | `0.7` | MEDIUM / HIGH boundary, **duplicated** | `main.py:252` |
| 9 | `strong_corr_threshold=0.7` | repeated in wrapper signature | `main.py:284`–`293` |
| 10 | `weak_corr_threshold=0.4` | repeated in wrapper signature | `main.py:284`–`293` |
| 11 | `delta_threshold=0.3` | repeated in wrapper signature | `main.py:284`–`293` |

**Critical defect — duplicated severity logic.** The LOW/MEDIUM/HIGH boundaries exist in **two places**: `get_alert_level()` at lines 209–213, and inline inside `generate_alerts()` at lines 247–252. `get_alert_level()` is defined but **never called anywhere** in the codebase — `generate_alerts()` reimplements the same thresholds by hand. Anyone tuning severity via `get_alert_level()` would see no effect on the API output. This is the single most misleading thing in the inherited code and should be fixed first in CCA113.

**Also note:** the three threshold parameters *are* function arguments of `generate_alerts()` and `detect_correlation_change_alert()`, but `server.py` never reads them from the request — so from an API caller's point of view they are effectively hardcoded. Exposing them is a `server.py` change, not just a `main.py` change.

### 4.2 Window and method defaults

| # | Value | Location |
|---|---|---|
| 12 | `window_size = 30` | `server.py:32` (multipart), `server.py:46` (JSON), `main.py:288` |
| 13 | `step_size = 5` | `server.py:33` (multipart), `server.py:47` (JSON), `main.py:289` |
| 14 | `method = "pearson"` | `server.py:34`, `server.py:48`, `main.py:102`, `main.py:290` |

Three separate copies of each default. Changing the default requires editing all three, and they can silently drift apart.

### 4.3 Column-name assumptions

| # | Assumption | Location | Risk |
|---|---|---|---|
| 15 | column must be literally named `"time"` | `preprocessing.py:9` — raises `ValueError` | breaks on ThingSpeak feeds using `created_at` |
| 16 | `time_col: str = "time"` default | `preprocessing.py:17, 38, 99, 117` | same |
| 17 | `"timestamp_col": "time"` | `final_pipeline.py:9` | test client only |
| 18 | `selected_streams: ["s1","s2","s3"]` | `final_pipeline.py:10` | test client only |

The API accepts a `timestamp_col` parameter, but `load_sensor_data()` still hard-fails on a missing `"time"` column. Because the API path does not call `load_sensor_data()`, this is currently latent — but it will surface the moment anyone reuses that helper for ThingSpeak ingestion.

### 4.4 Preprocessing constants

| # | Value | Meaning | Location |
|---|---|---|---|
| 19 | `iqr_factor = 3.0` | outlier aggressiveness | `preprocessing.py:68` (default), `main.py:50` (call site) |
| 20 | `quantile(0.25)` / `quantile(0.75)` | IQR quartiles | `preprocessing.py:76`, `preprocessing.py:77` |
| 21 | `method="interpolate"` | missing-value strategy | `preprocessing.py:49` (default), `main.py:43` (call site) |
| 22 | `freq = 1` | resampling frequency | `preprocessing.py:99` |
| 23 | `np.float64` | forced dtype | `preprocessing.py:128` |

### 4.5 Paths, ports and output limits

| # | Value | Location | Note |
|---|---|---|---|
| 24 | `"datasets/complex.csv"` | `preprocessing.py:5`, `preprocessing.py:136` | relative path |
| 25 | `"datasets/clean_sensor_data.csv"` | `preprocessing.py:137` | relative path |
| 26 | `"../datasets/complex.csv"` | `final_pipeline.py:4` | **different relative depth** — breaks depending on working directory |
| 27 | `port=5001`, `debug=True` | `server.py:108` | `debug=True` must not ship to any shared environment |
| 28 | `http://127.0.0.1:5001/...` | `final_pipeline.py:17` | hardcoded host |
| 29 | `.round(4)` | `server.py:82` | correlation matrix precision in API response |
| 30 | `round(..., 4)` | `main.py:179` | delta precision |
| 31 | `alerts[:5]` | `final_pipeline.py:41` | test client prints only 5 |

---

## 5. Findings summary

| # | Finding | Severity | Follow-up |
|---|---|---|---|
| F1 | `get_alert_level()` (main.py:196) is dead code; severity logic duplicated inline at main.py:247–252 | **High** | CCA113 |
| F2 | Threshold parameters exist in Python but are not exposed by the API — `server.py` never reads them from the request | **High** | CCA113 |
| F3 | `window_size` / `step_size` / `method` defaults duplicated in 3 places each | Medium | CCA113 |
| F4 | `align_to_common_index()` never runs in the API path, yet rolling windows assume evenly spaced rows | Medium | CCA112 |
| F5 | Hard requirement on a column literally named `"time"` (preprocessing.py:9) | Medium | CCA112 |
| F6 | `debug=True` on the Flask app (server.py:108) | Medium | CCA113 |
| F7 | Inconsistent relative dataset paths between `preprocessing.py` and `final_pipeline.py` | Low | CCA116 |
| F8 | No module separation — window, correlation and alerting all inside `main.py` | Low | note for Architecture team |

---

## 6. Cross-references

- **CCA113** (Vishnu) — items 1–14 and 19–23 in section 4 are the work list; start with F1 and F2.
- **CCA112** (Guna) — F4 and F5 relate to the preprocessing defects from CCA109.
- **CCA114** (Thirupathaiah + Tommy) — the output shape in section 3.1 is the starting point for the v1 output contract.
- **CCA108** (Vishnu) — evaluated `window_size`/`step_size` combinations against these defaults and recommended Pearson 40/20; Spearman requests returned HTTP 500 and remain unresolved.

---

## 7. How this was produced

Static read of `correlation_alert/server.py`, `main.py`, `preprocessing.py` and `final_pipeline.py` at commit `a81b394`. Line numbers refer to that commit. No code was modified.

*Note: line references should be re-checked if the audit is repeated after any merge into `main`.*
