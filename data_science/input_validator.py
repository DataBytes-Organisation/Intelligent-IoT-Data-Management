"""
input_validator.py (v4 — Week 5, rebased onto the merged v3 base per Lucas's PR #5 review)
Shared input validator for the Models sub-team pipeline.

Built on the Week 4 v3 validator (merged into main via PR #3):
  - Supports a DatetimeIndex as well as a timestamp column.
  - min_readings parameter (min_rows kept as a deprecated alias).
  - Numeric-time handling matches preprocessor.py's actual behaviour: falls
    back to a synthesized datetime index (2024-01-01, 1 row/second) when no
    literal timestamp column is present, instead of mis-parsing 1970-epoch
    dates or rejecting the data outright.

v4 additions (Week 5 — "lock the input boundary", carried forward from the
Week 5 branch and rebased onto the merged v3 base):
  - sensor_id / sensor_id_col support: tag results with a sensor identifier,
    either a single constant ID for the whole dataset (sensor_id) or a
    per-row column (sensor_id_col). Mutually exclusive.
  - sensor_id_col now normalises to a column literally named 'sensor_id' in
    the output, matching the documented contract (addresses Lucas's PR #5
    review point: previously the original column name was kept as-is).

Owner: Deepakkumar Govindan (Week 5 — Input boundary validator + pipeline integration)
"""

import pandas as pd
import warnings

REQUIRED_TIMESTAMP_COL = "timestamp"
MIN_PLAUSIBLE_YEAR = 2000  # timestamps parsing to before this are almost certainly not real calendar time

# Matches preprocessor.py's synthetic-index fallback exactly, for consistency
# across the pipeline.
SYNTHETIC_INDEX_START = "2024-01-01"
SYNTHETIC_INDEX_FREQ = "s"


class InputValidationError(Exception):
    """Raised when input sensor data does not meet the required Models input format."""
    pass


def validate_input(
    df: pd.DataFrame,
    timestamp_col: str = REQUIRED_TIMESTAMP_COL,
    sensor_cols=None,
    sensor_id: str = None,
    sensor_id_col: str = None,
    min_readings: int = 1,
    min_rows: int = None,  # deprecated alias for min_readings
    timestamp_is_index: bool = False,
) -> pd.DataFrame:
    """
    Validate a raw sensor data DataFrame against the shared Models input format (v4).

    Accepts a timestamp in any of these forms:
      1. df already has a pandas DatetimeIndex -- used directly.
      2. df has a column literally named `timestamp_col` (default 'timestamp')
         -- parsed as real calendar time.
      3. Neither of the above (e.g. only a numeric 'time' column) -- a fresh,
         evenly-spaced synthetic datetime index is generated, matching
         preprocessor.py's existing fallback behaviour exactly, rather than
         mis-parsing the numeric values as real dates.

    Required format:
      - df must be a pandas DataFrame, not empty, with at least `min_readings` rows
      - timestamps (index or column) must be unique and are sorted ascending
      - must contain at least one numeric sensor value column
      - sensor columns must not contain NaN / missing values
      - sensor columns must be numeric (int or float)

    Args:
      min_readings: reject data with fewer than this many rows. (min_rows is
        accepted as a deprecated alias for backward compatibility.)
      sensor_id / sensor_id_col: tag results with a sensor identifier, either a
        single constant ID for the whole dataset, or a per-row column. Mutually
        exclusive. If sensor_id_col is provided, the output column is
        normalised to be named 'sensor_id' regardless of the original column
        name.
      timestamp_is_index: acknowledges that a column literally named
        `timestamp_col` is actually a numeric sample index, not real time --
        needed only when that column happens to be named exactly
        `timestamp_col`; otherwise the synthetic-index fallback (case 3 above)
        already handles this without needing the flag.

    Returns:
      A validated copy of the DataFrame, sorted by timestamp and indexed by it.
      If sensor_id / sensor_id_col was provided, a 'sensor_id' column is
      present (constant value for sensor_id, normalised passthrough for
      sensor_id_col).

    Raises:
      InputValidationError with a specific, readable message describing exactly
      what failed and why.
    """
    if not isinstance(df, pd.DataFrame):
        raise InputValidationError(f"Expected a pandas DataFrame, got {type(df).__name__}")

    if df.empty:
        raise InputValidationError("Input DataFrame is empty — no rows to process")

    if min_rows is not None:
        warnings.warn(
            "min_rows is deprecated, use min_readings instead (kept for backward compatibility)",
            DeprecationWarning,
            stacklevel=2,
        )
        if min_readings == 1:  # only defer to min_rows if caller didn't also set min_readings
            min_readings = min_rows

    if len(df) < min_readings:
        raise InputValidationError(f"Not enough readings: got {len(df)}, minimum required is {min_readings}")

    if sensor_id is not None and sensor_id_col is not None:
        raise InputValidationError("Provide either sensor_id or sensor_id_col, not both")

    if sensor_id_col is not None and sensor_id_col not in df.columns:
        raise InputValidationError(f"sensor_id_col '{sensor_id_col}' not found in data. Found columns: {list(df.columns)}")

    df = df.copy()

    using_datetime_index = isinstance(df.index, pd.DatetimeIndex)

    if using_datetime_index:
        # Timestamp already validated as the DataFrame's index -- this is how
        # existing Models preprocessing hands off data. Just check integrity.
        if df.index.duplicated().any():
            dupes = df.index[df.index.duplicated()].tolist()
            raise InputValidationError(
                f"Duplicate timestamps found in index: {dupes[:5]}{' ...' if len(dupes) > 5 else ''}"
            )
        df = df.sort_index()
        exclude_cols = set()

    elif timestamp_col not in df.columns:
        # No literal timestamp column present. Matches preprocessor.py's
        # existing fallback: rather than treating a numeric/non-time column
        # (e.g. 'time') as real calendar time -- which produces meaningless
        # dates -- synthesize a clean datetime index of the same length,
        # using the same start date and frequency convention already used
        # elsewhere in the pipeline.
        original_cols = list(df.columns)
        df.index = pd.date_range(start=SYNTHETIC_INDEX_START, periods=len(df), freq=SYNTHETIC_INDEX_FREQ)
        # Deliberate difference from preprocessor.py: DROP any leftover
        # numeric time-like column entirely rather than silently leaving it
        # in the data to be treated as a sensor value downstream. Flagged
        # for review -- preprocessor.py currently leaves this column in.
        drop_cols = [c for c in original_cols if c.lower() in ("time", "timestamp", "date", "datetime")
                     and pd.api.types.is_numeric_dtype(df[c])]
        if drop_cols:
            df = df.drop(columns=drop_cols)
        exclude_cols = set()

    else:
        # A column literally named timestamp_col is present -- validate/parse
        # it as real calendar time.
        was_numeric_timestamp = pd.api.types.is_numeric_dtype(df[timestamp_col])

        if was_numeric_timestamp and timestamp_is_index:
            pass
        else:
            try:
                df[timestamp_col] = pd.to_datetime(df[timestamp_col])
            except Exception as e:
                raise InputValidationError(f"Column '{timestamp_col}' could not be parsed as datetime: {e}")

            if was_numeric_timestamp:
                implausible = (df[timestamp_col].dt.year < MIN_PLAUSIBLE_YEAR).all()
                if implausible:
                    example = df[timestamp_col].iloc[0]
                    raise InputValidationError(
                        f"Column '{timestamp_col}' is numeric and parsed to implausible dates "
                        f"(all before year {MIN_PLAUSIBLE_YEAR}, e.g. {example}). This usually means it's a "
                        f"sample index, not real calendar time. Either rename/remove it so validate_input() "
                        f"falls back to a synthetic index (matching preprocessor.py), or call "
                        f"validate_input(..., timestamp_is_index=True) to acknowledge it explicitly."
                    )

        if df[timestamp_col].duplicated().any():
            dupes = df[timestamp_col][df[timestamp_col].duplicated()].tolist()
            preview = dupes[:5]
            raise InputValidationError(
                f"Duplicate timestamps found: {preview}{' ...' if len(dupes) > 5 else ''}"
            )

        df = df.sort_values(timestamp_col).reset_index(drop=True)
        df = df.set_index(timestamp_col)
        exclude_cols = set()

    if sensor_id_col is not None:
        if df[sensor_id_col].isna().any():
            raise InputValidationError(f"Missing sensor IDs found in column '{sensor_id_col}'")
        # v4 fix (Week 5, addressing Lucas's review of PR #5): normalise to a
        # column literally named 'sensor_id', matching the documented
        # contract, instead of keeping the original column name.
        if sensor_id_col != "sensor_id":
            df = df.rename(columns={sensor_id_col: "sensor_id"})
        exclude_cols.add("sensor_id")

    if sensor_cols is None:
        sensor_cols = [c for c in df.columns if c not in exclude_cols]

    if not sensor_cols:
        raise InputValidationError("No sensor value columns found besides timestamp/sensor-id columns")

    missing_cols = [c for c in sensor_cols if c not in df.columns]
    if missing_cols:
        raise InputValidationError(f"Declared sensor columns not found in data: {missing_cols}")

    non_numeric = [c for c in sensor_cols if not pd.api.types.is_numeric_dtype(df[c])]
    if non_numeric:
        raise InputValidationError(f"Sensor column(s) are not numeric: {non_numeric}")

    nan_report = {c: int(df[c].isna().sum()) for c in sensor_cols if df[c].isna().any()}
    if nan_report:
        raise InputValidationError(f"Missing (NaN) values found in sensor columns: {nan_report}")

    if sensor_id is not None:
        df["sensor_id"] = sensor_id

    return df


if __name__ == "__main__":
    print("=== Test 1: DatetimeIndex input (matches preprocessor.py output shape) ===")
    df_idx = pd.DataFrame(
        {"s1": [1.0, 1.1, 1.2, 1.3, 1.4], "s2": [2.0, 2.1, 2.2, 2.3, 2.4]},
        index=pd.date_range("2026-01-01", periods=5, freq="h"),
    )
    r1 = validate_input(df_idx)
    print(r1)
    print("PASSED\n")

    print("=== Test 2: literal 'timestamp' column (real calendar time) ===")
    good = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=5, freq="h"),
        "s1": [10.1, 10.3, 10.2, 50.9, 10.4],
    })
    r2 = validate_input(good)
    print(r2)
    print("PASSED\n")

    print("=== Test 3: no timestamp column, only numeric 'time' -- synthesized index (matches preprocessor.py) ===")
    numeric_time_df = pd.DataFrame({
        "time": [0, 0.01, 0.02, 0.03, 0.04],
        "s1": [1.0, 1.01, 1.02, 1.03, 1.04],
    })
    r3 = validate_input(numeric_time_df, min_readings=3)
    print(r3)
    print(f"Columns in output: {list(r3.columns)}")
    print("PASSED (synthetic index generated, raw 'time' column dropped)\n")

    print("=== Test 4: min_readings enforcement ===")
    try:
        validate_input(df_idx, min_readings=10)
        print("FAILED")
    except InputValidationError as e:
        print(f"REJECTED correctly: {e}\n")

    print("=== Test 5: deprecated min_rows alias still works ===")
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        try:
            validate_input(df_idx, min_rows=10)
            print("FAILED")
        except InputValidationError as e:
            print(f"REJECTED correctly: {e}")
        print(f"DeprecationWarning raised: {any(issubclass(x.category, DeprecationWarning) for x in w)}\n")

    print("=== Test 6: numeric column literally named 'timestamp' -- still rejected unless acknowledged ===")
    bad_named_timestamp = pd.DataFrame({
        "timestamp": [0, 0.01, 0.02, 0.03, 0.04],
        "s1": [1.0, 1.01, 1.02, 1.03, 1.04],
    })
    try:
        validate_input(bad_named_timestamp)
        print("FAILED")
    except InputValidationError as e:
        print(f"REJECTED correctly: {e}\n")

    print("=== Test 7: same case, explicitly acknowledged via timestamp_is_index ===")
    r7 = validate_input(bad_named_timestamp, timestamp_is_index=True)
    print(r7)
    print("PASSED\n")

    print("=== Test 8: missing value still rejected (regression check) ===")
    bad_missing = good.copy()
    bad_missing.loc[1, "s1"] = None
    try:
        validate_input(bad_missing)
        print("FAILED")
    except InputValidationError as e:
        print(f"REJECTED correctly: {e}\n")

    print("=== Test 9: sensor_id constant tag (Week 5) ===")
    r9 = validate_input(good, sensor_id="temperature_sensor_01")
    print(r9)
    assert "sensor_id" in r9.columns
    print("PASSED\n")

    print("=== Test 10: sensor_id_col normalises to a 'sensor_id' column (v4 fix, Week 5) ===")
    with_device_col = good.copy()
    with_device_col["device_id"] = "sensor_A"
    r10 = validate_input(with_device_col, sensor_id_col="device_id")
    print(r10)
    assert "sensor_id" in r10.columns, "FAILED: sensor_id column not present"
    assert "device_id" not in r10.columns, "FAILED: original column name still present"
    print("PASSED (original 'device_id' column renamed to standard 'sensor_id')\n")

    print("=== Test 11: sensor_id/sensor_id_col mutual exclusivity (regression check) ===")
    try:
        validate_input(with_device_col, sensor_id="x", sensor_id_col="device_id")
        print("FAILED")
    except InputValidationError as e:
        print(f"REJECTED correctly: {e}")
