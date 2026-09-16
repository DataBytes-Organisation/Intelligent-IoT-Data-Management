# CCA108 — Rolling-Window Parameter and Correlation Method Evaluation

**Owner:** Vishnu Vardhan Reddy Pulluru
**Due date:** Sunday, 26 July 2026
**Project:** Intelligent IoT Data Management

## 1. Objective

The objective was to measure how correlation-alert output changes with different `window_size`, `step_size`, and correlation methods. The dataset, timestamp column, and selected streams were held constant so that the effect of the tested parameters could be compared fairly.

The purpose was to support an evidence-based default configuration rather than automatically retaining the values inherited from the T1 implementation.

## 2. Technical background

Pearson correlation measures linear relationships between variables. Spearman correlation measures monotonic relationships using ranked values.

The service divides the time series into overlapping rolling windows. Correlations are calculated within each window, and the delta between consecutive windows is used to identify changes in relationships between sensor streams.

## 3. Dataset and test environment

| Item | Value |
| Dataset | `datasets/complex.csv` |
| Dataset rows | 1008 |
| Timestamp column | `time` |
| Sensor streams | `s1`, `s2`, `s3` |
| Missing values | 0 |
| Window configurations | 20/10, 40/20, 60/30 |
| Methods requested | Pearson and Spearman |
| Runtime repetitions | 3 per configuration |
| API endpoint | `/detect-correlation-alert` |

The preprocessing logs confirmed that the dataset was sorted, converted to numeric form, cleaned, and validated successfully before correlation analysis.

## 4. Test configurations

The following configurations were tested while keeping the dataset and streams unchanged:

1. `window_size=20`, `step_size=10`
2. `window_size=40`, `step_size=20`
3. `window_size=60`, `step_size=30`

Each configuration was requested with both `pearson` and `spearman`.

## 5. Results

| Method | Window | Step | Status | Windows | Alerts | LOW | MEDIUM | HIGH | Average runtime |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Pearson | 20 | 10 | SUCCESS | 99 | 19 | 3 | 13 | 3 | 30.846 ms |
| Spearman | 20 | 10 | FAILED (HTTP 500) | N/A | N/A | N/A | N/A | N/A | 7.188 ms — time to failure |
| Pearson | 40 | 20 | SUCCESS | 49 | 18 | 2 | 12 | 4 | 13.302 ms |
| Spearman | 40 | 20 | FAILED (HTTP 500) | N/A | N/A | N/A | N/A | N/A | 6.423 ms — time to failure |
| Pearson | 60 | 30 | SUCCESS | 32 | 20 | 2 | 15 | 3 | 10.848 ms |
| Spearman | 60 | 30 | FAILED (HTTP 500) | N/A | N/A | N/A | N/A | N/A | 6.601 ms — time to failure |

Spearman entries are reported as failed rather than as zero alerts because the API did not complete the correlation calculation.

## 6. Findings

### 6.1 Alert output

Pearson produced between 18 and 20 alerts across the three configurations. The 40/20 configuration produced the lowest total alert count, with 18 alerts.

The 20/10 configuration produced 19 alerts across 99 rolling windows. The 40/20 configuration produced 18 alerts across 49 windows. The 60/30 configuration produced 20 alerts across 32 windows.

This shows that reducing the number of windows did not produce a proportional reduction in alert volume.

### 6.2 Severity distribution

MEDIUM alerts were the largest severity category in every successful Pearson configuration.

The 40/20 configuration retained all three severity levels while producing the lowest overall alert count.

### 6.3 Spearman implementation failure

All three lowercase `spearman` requests reached preprocessing successfully but returned HTTP 500 during later processing.

The repeated error was:

`'NoneType' object cannot be interpreted as an integer`

Alternative spellings such as `Spearman`, `SPEARMAN`, and `spearmanr` were rejected as invalid method names. Therefore, lowercase `spearman` was the correct API value, but the inherited Spearman execution path failed internally.

### 6.4 Runtime and scalability

Each configuration was executed three times and the average request runtime was recorded.

The highest average runtime among successful configurations was 30.846 ms. No noticeable runtime threshold was reached on this 1008-row, three-stream dataset.

The 20/10 configuration evaluated the greatest number of rolling windows and is therefore the configuration most likely to create higher processing cost as dataset size or stream count increases.

Spearman failure runtimes represent time to failure and must not be interpreted as successful Spearman processing performance.

### 6.5 Timestamp observation

The sequential integer values in the `time` column were interpreted as values close to the Unix epoch, producing timestamps around 1 January 1970. This does not affect the controlled parameter comparison but should be corrected before meaningful dashboard display.

## 7. Three-line recommendation

Use Pearson with `window_size=40` and `step_size=20` as the provisional default for the current dataset.
It produced the lowest alert total while retaining LOW, MEDIUM, and HIGH severity detection and reducing the rolling-window count from 99 to 49 compared with 20/10.
Retest the recommendation after the inherited Spearman defect is fixed and when a larger real IoT dataset becomes available.

## 8. Limitations

The evaluation used one simulated dataset containing 1008 rows and three sensor streams. Spearman could not be compared successfully because all Spearman requests returned HTTP 500. Runtime behaviour may change significantly with larger datasets, smaller step sizes, or additional sensor streams.

## 9. Evidence files

- `CCA108_final_results.csv`
- `CCA108_runtime_runs.csv`
- `CCA108_benchmark_console.txt`
- Raw API responses in `cca108_raw_evidence/`

## Numbered defects

### Defect 1 — Spearman correlation returns HTTP 500

**Configurations affected:** `20/10`, `40/20`, and `60/30` using lowercase `spearman`.

**Steps to reproduce:** Submit `datasets/complex.csv` to `/detect-correlation-alert` using timestamp column `time`, streams `s1,s2,s3`, and method `spearman`.

**Expected result:** The API should complete the Spearman rolling-window calculation and return alert totals, severity distribution, and runtime.

**Actual result:** All three configurations return HTTP 500 with the message `'NoneType' object cannot be interpreted as an integer`.

**Impact:** Spearman cannot currently be compared with Pearson or selected as a default correlation method.

**Investigation result:** Dataset preprocessing completes successfully before the failure. The defect therefore occurs in the inherited Spearman processing path after validation. The root cause requires further investigation under CCA113.

**Evidence:** Raw responses and screenshots are stored under `correlation_alert/docs/evidence/CCA108_vishnu/`.
