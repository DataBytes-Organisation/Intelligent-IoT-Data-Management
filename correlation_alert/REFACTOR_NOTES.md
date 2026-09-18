# Correlation Alert Refactor Notes

## Scope:

This folder contains the refactored correlation alert service. The previous implementation remains in `correlation_alert_previ` for comparison.

## New structure:

1. `preprocessing.py` owns input cleaning and timestamp handling.
2. `correlation.py` owns windows, correlation changes, and alert rules.
3. `serialization.py` owns API output formatting.
4. `main.py` combines the preprocessing and correlation facades.
5. `server.py` owns HTTP request parsing and response creation.

## preprocessing.py:

### `run_preprocessing_pipeline()`:

This is the single public preprocessing facade. It replaces the two different flows previously found in `main.preprocess_timeseries()` and `preprocessing.run_pipeline()`.

It validates columns, parses timestamps, converts sensor values, optionally aligns timestamps, fills missing values, handles outliers, validates output, and sets the timestamp index.

### `fix_timestamps()`:

Numeric counters and datetime values are detected separately. Numeric counters remain numeric and no longer become timestamps in 1970.

Invalid and duplicate timestamps are counted in `data_quality`.

### `align_to_common_index()`:

Alignment runs only when `sampling_frequency` is supplied. There is no hardcoded `5min` fallback.

The function inserts missing timestamps. Missing sensor values are filled later by the configured missing value strategy.

### `convert_sensor_columns_to_numeric()`:

Non numeric sensor values are converted to missing values. Counts are recorded by column.

### `handle_missing_values()`:

The supported strategies are `interpolate`, `ffill`, and `drop`. Unknown methods now raise `InputValidationError`.

### `remove_outliers()`:

The IQR rule remains. The number of replaced values is now stored in `data_quality`.

### `validate_output()`:

Empty data, unsorted timestamps, and remaining missing values now produce clear validation errors.

## correlation.py:

### `run_correlation_pipeline()`:

This is the single public correlation facade. It validates parameters, creates windows, computes matrices, compares changes, and generates alerts.

### `validate_correlation_parameters()`:

Window sizes, step sizes, correlation methods, threshold ranges, and threshold ordering are checked before analysis.

### `create_rolling_windows()`:

Zero and negative sizes are rejected. A window larger than the processed dataset is rejected with a clear input error.

The function no longer makes an explicit copy for every overlapping window.

### `compute_window_correlations()`:

Only `pearson` and `spearman` are accepted. Window timestamps and raw correlation matrices are preserved.

### `compare_correlation_changes()`:

Raw correlation values are retained for decisions. Rounding was removed from this stage.

Undefined correlations are returned as `skipped_pairs` instead of being discarded silently.

### `get_alert_level()`:

This is now the single severity rule. The duplicate severity logic was removed from `generate_alerts()`.

### `generate_alerts()`:

Correlation strength uses absolute values. A strong negative correlation is no longer treated as weak.

Sign reversals between two strong correlations are classified by delta. Transition alerts keep a minimum severity of `MEDIUM` and may rise to `HIGH`.

Each change calls `create_alert()` at most once.

### `create_alert()`:

The output contract remains explicit. Raw analytical values are kept until serialization.

## serialization.py:

### `to_iso8601()`:

Python and NumPy numeric counters remain numeric. Datetimes are returned as ISO 8601 strings ending in `Z`.

### `with_iso_timestamps()`:

The function returns new records and does not mutate pipeline output.

### `serialize_correlation_results()`:

Correlation matrices are rounded only while building the API response. The raw matrices remain unchanged.

## main.py:

### `detect_correlation_change_alert()`:

The function now calls only `run_preprocessing_pipeline()` and `run_correlation_pipeline()`. It combines their results without implementing stage logic.

## server.py:

### `parse_request_input()`:

JSON and multipart requests share one typed parsing flow. Window settings, correlation method, thresholds, missing value strategy, outlier factor, and sampling frequency are accepted.

Missing optional fields use defaults. Supplied invalid values return HTTP 400.

### `build_api_response()`:

Response serialization is delegated to `serialization.py`. The response also reports `skipped_pairs` and full data quality counts.

### `create_app()`:

The Flask app uses a factory for testability. Debug mode is disabled when the module is run directly.

## Tests:

The automated tests cover numeric timestamps, optional alignment, unique streams, invalid windows, negative correlation sign reversal, raw threshold decisions, skipped pairs, both facade functions, NumPy serialization, response rounding, API threshold input, and HTTP 400 validation.

Run from the repository root:

```text
/opt/anaconda3/bin/python -m pytest correlation_alert/tests -q
```
