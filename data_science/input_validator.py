import pandas as pd


def validate_input(
    df,
    timestamp_col="timestamp",
    sensor_cols=None,
    min_readings=20,
):
    """Validate sensor data before sending it to analytics."""

    if df is None:
        raise ValueError("Input data cannot be None.")

    if not isinstance(df, pd.DataFrame):
        raise ValueError("Input data must be a pandas DataFrame.")

    if df.empty:
        raise ValueError("Input data is empty.")

    if sensor_cols is None:
        sensor_cols = []

    required_columns = [timestamp_col] + sensor_cols

    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "Input data is missing required columns: "
            + ", ".join(missing_columns)
        )

    if len(df) < min_readings:
        raise ValueError(
            f"Insufficient readings. At least {min_readings} readings are required."
        )

    timestamps = pd.to_datetime(df[timestamp_col], errors="coerce")

    if timestamps.isna().any():
        raise ValueError("Input data contains invalid timestamps.")

    for sensor_col in sensor_cols:
        if df[sensor_col].isna().any():
            raise ValueError(
                f"Sensor values are missing in column '{sensor_col}'."
            )

        if not pd.api.types.is_numeric_dtype(df[sensor_col]):
            raise ValueError(
                f"Sensor values in column '{sensor_col}' must be numeric."
            )

    return True