import pandas as pd
import pytest

from data_science.input_validator import validate_input


def make_valid_data():
    return pd.DataFrame({
        "timestamp": pd.date_range(
            "2026-09-12 10:00:00",
            periods=20,
            freq="min"
        ),
        "sensor_value": range(20),
    })


def test_valid_input():
    df = make_valid_data()

    assert validate_input(
        df,
        timestamp_col="timestamp",
        sensor_cols=["sensor_value"],
        min_readings=20,
    ) is True


def test_none_input():
    with pytest.raises(ValueError, match="cannot be None"):
        validate_input(None)


def test_empty_input():
    df = pd.DataFrame(columns=["timestamp", "sensor_value"])

    with pytest.raises(ValueError, match="empty"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
        )


def test_missing_required_column():
    df = make_valid_data().drop(columns=["sensor_value"])

    with pytest.raises(ValueError, match="missing required columns"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
        )


def test_missing_timestamp_column():
    df = make_valid_data().drop(columns=["timestamp"])

    with pytest.raises(ValueError, match="missing required columns"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
        )


def test_insufficient_readings():
    df = make_valid_data().head(5)

    with pytest.raises(ValueError, match="Insufficient readings"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
            min_readings=20,
        )


def test_missing_sensor_value():
    df = make_valid_data()
    df.loc[5, "sensor_value"] = None

    with pytest.raises(ValueError, match="Sensor values are missing"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
        )


def test_invalid_sensor_value():
    df = make_valid_data()
    df["sensor_value"] = "invalid"

    with pytest.raises(ValueError, match="must be numeric"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
        )


def test_invalid_timestamp():
    df = make_valid_data()
    df["timestamp"] = df["timestamp"].astype(object)
    df.loc[5, "timestamp"] = "invalid timestamp"

    with pytest.raises(ValueError, match="invalid timestamps"):
        validate_input(
            df,
            timestamp_col="timestamp",
            sensor_cols=["sensor_value"],
        )


def test_multiple_sensor_columns():
    df = make_valid_data()
    df["sensor_2"] = range(20, 40)

    assert validate_input(
        df,
        timestamp_col="timestamp",
        sensor_cols=["sensor_value", "sensor_2"],
        min_readings=20,
    ) is True


def test_invalid_dataframe_type():
    with pytest.raises(ValueError, match="pandas DataFrame"):
        validate_input(
            {"timestamp": [], "sensor_value": []}
        )