# Models Sub-Team — Required Input Format (v3)
**Owner:** Deepakkumar Govindan · Week 4 (PR #3)

This is the shared input contract enforced by `input_validator.py` before data reaches a detector.

## Accepted timestamp forms (in priority order)

1. **DatetimeIndex** — if the DataFrame already has a pandas DatetimeIndex (how existing Models preprocessing hands off data), it's used directly.
2. **A column literally named `timestamp`** (configurable via `timestamp_col`) — parsed as real calendar time. If this column is numeric and parses to implausible dates (all before year 2000), it is rejected with a clear error unless you explicitly pass `timestamp_is_index=True`.
3. **Neither of the above** (e.g. only a numeric `time` column, as in `datasets/complex.csv`) — a synthetic datetime index is generated (`2024-01-01`, 1 row/second), matching `preprocessor.py`'s existing fallback behaviour exactly. The original numeric column is dropped rather than silently treated as a sensor value — this is a deliberate difference from `preprocessor.py`, which currently leaves that column in.

## Required structure

| Field | Type | Rule |
|---|---|---|
| Timestamp (index or column) | datetime | See accepted forms above. Must be unique — no duplicate timestamps. Data is sorted ascending. |
| One or more sensor value columns | numeric (int/float) | At least one required. No missing/NaN values allowed — reject, don't silently fill. |
| `min_readings` | int, optional | Minimum row count required (default 1). `min_rows` accepted as a deprecated alias. |
| `sensor_id` / `sensor_id_col` | string, optional | Tag results with a sensor identifier — a constant ID for the whole dataset, or a per-row column. Mutually exclusive. |

## What the validator checks, in order

1. Input is a pandas DataFrame, not empty, and meets `min_readings`.
2. Timestamp source resolved per the priority order above.
3. No duplicate timestamps.
4. At least one numeric sensor column exists.
5. No NaN/missing values in any sensor column.

If any check fails, `validate_input()` raises `InputValidationError` with a specific message instead of letting bad data reach a detector and fail unpredictably later.

## Usage

```python
from input_validator import validate_input, InputValidationError

# Case 1: already has a DatetimeIndex (e.g. from preprocessor.py)
clean_df = validate_input(preprocessed_df, min_readings=10)

# Case 2: has a real 'timestamp' column
clean_df = validate_input(raw_df)

# Case 3: no timestamp column at all (e.g. complex.csv) -- synthetic index generated automatically
clean_df = validate_input(raw_df, sensor_id="temperature_sensor_01", min_readings=10)
```

## Known limitations

- The numeric-time fallback (case 3) assumes a fixed 1-row-per-second spacing; it does not attempt to infer real elapsed time from the original numeric values.
- Multi-sensor identification beyond `sensor_id`/`sensor_id_col` (e.g. a mixed multi-device stream with varying sample rates) is not yet handled.
