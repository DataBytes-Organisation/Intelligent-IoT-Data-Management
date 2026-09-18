import numpy as np
import pandas as pd


class InputValidationError(ValueError):
    """Raised when caller input cannot be processed safely."""


def _validate_columns(df, timestamp_col, selected_streams):
    if not isinstance(df, pd.DataFrame):
        raise InputValidationError("data must be a pandas DataFrame")

    if timestamp_col not in df.columns:
        raise InputValidationError(
            f"Timestamp column '{timestamp_col}' was not found. "
            f"Available columns: {list(df.columns)}"
        )

    streams = list(selected_streams or [])
    if len(set(streams)) < 2:
        raise InputValidationError("At least 2 unique streams are required")
    if len(streams) != len(set(streams)):
        raise InputValidationError("selected_streams must not contain duplicates")
    if timestamp_col in streams:
        raise InputValidationError("timestamp_col cannot also be a selected stream")

    missing = [stream for stream in streams if stream not in df.columns]
    if missing:
        raise InputValidationError(
            f"Selected streams were not found: {missing}. "
            f"Available columns: {list(df.columns)}"
        )
    return streams


def fix_timestamps(df, time_col="time"):
    """Parse numeric counters or datetimes, then sort and deduplicate."""
    if time_col not in df.columns:
        raise InputValidationError(f"Timestamp column '{time_col}' was not found")

    result = df.copy()
    original_attrs = dict(result.attrs)
    original = result[time_col]
    total_rows = len(result)

    parsed_datetime = pd.to_datetime(
        original,
        errors="coerce",
        utc=True,
        format="mixed",
    )
    parsed_datetime = parsed_datetime.dt.tz_convert("UTC").dt.tz_localize(None)
    parsed_numeric = pd.to_numeric(original, errors="coerce")

    datetime_valid = int(parsed_datetime.notna().sum())
    numeric_valid = int(parsed_numeric.notna().sum())
    if datetime_valid > numeric_valid:
        result[time_col] = parsed_datetime
        timestamp_kind = "datetime"
    else:
        result[time_col] = parsed_numeric
        timestamp_kind = "numeric"

    invalid_count = int(result[time_col].isna().sum())
    result = result.dropna(subset=[time_col])
    duplicate_count = int(result.duplicated(subset=[time_col]).sum())
    result = result.drop_duplicates(subset=[time_col])
    result = result.sort_values(time_col).reset_index(drop=True)

    if result.empty:
        raise InputValidationError(
            f"No usable timestamps remain in '{time_col}' after checking {total_rows} rows"
        )

    result.attrs.update(original_attrs)
    result.attrs.update(
        {
            "timestamp_kind": timestamp_kind,
            "invalid_timestamps_removed": invalid_count,
            "duplicate_timestamps_removed": duplicate_count,
        }
    )
    return result


def convert_sensor_columns_to_numeric(df, time_col="time"):
    """Coerce sensor columns to numeric values and record affected cells."""
    result = df.copy()
    coerced_by_column = {}

    for column in result.columns:
        if column == time_col:
            continue
        missing_before = int(result[column].isna().sum())
        result[column] = pd.to_numeric(result[column], errors="coerce")
        coerced = int(result[column].isna().sum()) - missing_before
        if coerced:
            coerced_by_column[column] = coerced

    result.attrs["non_numeric_by_column"] = coerced_by_column
    result.attrs["non_numeric_coerced"] = sum(coerced_by_column.values())
    return result


def align_to_common_index(df, time_col="time", frequency=None):
    """Insert missing timestamps on an explicitly requested regular grid."""
    if frequency is None:
        return df.copy()

    result = df.copy()
    original_attrs = dict(result.attrs)
    result = result.set_index(time_col)

    if isinstance(result.index, pd.DatetimeIndex):
        try:
            full_index = pd.date_range(
                start=result.index.min(),
                end=result.index.max(),
                freq=frequency,
            )
        except (TypeError, ValueError) as exc:
            raise InputValidationError(f"Invalid datetime sampling_frequency: {frequency}") from exc
    else:
        try:
            step = float(frequency)
        except (TypeError, ValueError) as exc:
            raise InputValidationError(f"Invalid numeric sampling_frequency: {frequency}") from exc
        if step <= 0:
            raise InputValidationError("sampling_frequency must be positive")

        start = float(result.index.min())
        end = float(result.index.max())
        values = np.arange(start, end + step * 0.5, step)
        if all(float(value).is_integer() for value in values):
            values = values.astype(int)
        full_index = pd.Index(values, name=time_col)

    rows_before = len(result)
    result = result.reindex(full_index)
    result = result.reset_index().rename(columns={"index": time_col})
    result.attrs.update(original_attrs)
    result.attrs["rows_added_by_alignment"] = len(result) - rows_before
    return result


def handle_missing_values(df, time_col="time", method="interpolate"):
    """Fill or remove missing sensor values using one configured strategy."""
    result = df.copy()
    sensor_columns = [column for column in result.columns if column != time_col]
    missing_before = int(result[sensor_columns].isna().sum().sum())

    if method == "interpolate":
        result[sensor_columns] = result[sensor_columns].interpolate(
            method="linear",
            limit_direction="both",
        )
    elif method == "ffill":
        result[sensor_columns] = result[sensor_columns].ffill().bfill()
    elif method == "drop":
        result = result.dropna(subset=sensor_columns)
    else:
        raise InputValidationError(f"Unknown missing value method: {method}")

    missing_after = int(result[sensor_columns].isna().sum().sum())
    result.attrs["missing_imputed"] = missing_before - missing_after
    return result


def remove_outliers(df, sensor_cols, iqr_factor=3.0):
    """Replace IQR outliers and interpolate the removed sensor values."""
    if iqr_factor <= 0:
        raise InputValidationError("iqr_factor must be positive")

    result = df.copy()
    outlier_count = 0
    for column in sensor_cols:
        if result[column].isna().all():
            continue
        q1 = result[column].quantile(0.25)
        q3 = result[column].quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue

        lower = q1 - iqr_factor * iqr
        upper = q3 + iqr_factor * iqr
        mask = (result[column] < lower) | (result[column] > upper)
        outlier_count += int(mask.sum())
        result.loc[mask, column] = np.nan

    result[sensor_cols] = result[sensor_cols].interpolate(
        method="linear",
        limit_direction="both",
    )
    result.attrs["outliers_replaced"] = outlier_count
    return result


def validate_output(df, time_col="time"):
    """Require sorted timestamps and complete numeric sensor values."""
    if df.empty:
        raise InputValidationError("No rows remain after preprocessing")
    if not df[time_col].is_monotonic_increasing:
        raise InputValidationError("Timestamp values are not sorted")
    if int(df.isna().sum().sum()):
        raise InputValidationError("Missing values remain after preprocessing")

    result = df.copy()
    sensor_columns = [column for column in result.columns if column != time_col]
    result[sensor_columns] = result[sensor_columns].astype(np.float64)
    return result


def run_preprocessing_pipeline(
    df,
    timestamp_col,
    selected_streams: list[str],
    missing_method="interpolate",
    iqr_factor=3.0,
    sampling_frequency=None,
):
    """Run the single preprocessing flow used by API and direct callers."""
    streams = _validate_columns(df, timestamp_col, selected_streams)
    rows_in = len(df)
    result = df[[timestamp_col, *streams]].copy()
    result = fix_timestamps(result, timestamp_col)
    result = convert_sensor_columns_to_numeric(result, timestamp_col)
    result = align_to_common_index(result, timestamp_col, sampling_frequency)
    result = handle_missing_values(result, timestamp_col, missing_method)
    result = remove_outliers(result, streams, iqr_factor)
    result = validate_output(result, timestamp_col)

    quality = {
        "rows_in": rows_in,
        "rows_out": len(result),
        "invalid_timestamps_removed": result.attrs.get("invalid_timestamps_removed", 0),
        "duplicate_timestamps_removed": result.attrs.get("duplicate_timestamps_removed", 0),
        "non_numeric_coerced": result.attrs.get("non_numeric_coerced", 0),
        "non_numeric_by_column": result.attrs.get("non_numeric_by_column", {}),
        "rows_added_by_alignment": result.attrs.get("rows_added_by_alignment", 0),
        "missing_imputed": result.attrs.get("missing_imputed", 0),
        "outliers_replaced": result.attrs.get("outliers_replaced", 0),
    }

    timestamp_kind = result.attrs.get("timestamp_kind")
    result = result.set_index(timestamp_col)
    result.attrs["timestamp_kind"] = timestamp_kind
    result.attrs["data_quality"] = quality
    return result
