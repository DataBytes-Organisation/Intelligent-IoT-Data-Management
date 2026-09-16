import pandas as pd
import pytest

from correlation_alert.preprocessing import (
    InputValidationError,
    run_preprocessing_pipeline,
)


def test_numeric_timestamps_remain_numeric():
    df = pd.DataFrame(
        {
            "time": [3, 1, 2],
            "sensor_a": [30, 10, 20],
            "sensor_b": [60, 20, 40],
        }
    )

    result = run_preprocessing_pipeline(df, "time", ["sensor_a", "sensor_b"])

    assert result.index.tolist() == [1, 2, 3]
    assert pd.api.types.is_numeric_dtype(result.index)


def test_iso_8601_timestamps_are_preserved():
    df = pd.DataFrame(
        {
            "timestamp": ["2015-09-01 13:45:00", "2015-09-01 13:50:00"],
            "sensor_a": [10, 20],
            "sensor_b": [30, 40],
        }
    )

    result = run_preprocessing_pipeline(
        df,
        "timestamp",
        ["sensor_a", "sensor_b"],
    )

    assert result.index.tolist() == [
        pd.Timestamp("2015-09-01 13:45:00"),
        pd.Timestamp("2015-09-01 13:50:00"),
    ]


def test_thingspeak_utc_timestamps_become_timezone_naive():
    df = pd.DataFrame(
        {
            "created_at": ["2026-08-04T07:53:24Z", "2026-08-04T07:52:24Z"],
            "field1": [113, 0],
            "field2": [54, 21],
        }
    )

    result = run_preprocessing_pipeline(
        df,
        "created_at",
        ["field1", "field2"],
    )

    assert result.index[0] == pd.Timestamp("2026-08-04 07:52:24")
    assert result.index.tz is None


def test_duplicate_timestamp_is_removed():
    df = pd.DataFrame(
        {
            "timestamp": [
                "2015-09-01 13:45:00",
                "2015-09-01 13:45:00",
                "2015-09-01 13:50:00",
            ],
            "sensor_a": [10, 20, 30],
            "sensor_b": [40, 50, 60],
        }
    )

    result = run_preprocessing_pipeline(
        df,
        "timestamp",
        ["sensor_a", "sensor_b"],
    )

    assert len(result) == 2
    assert result.attrs["data_quality"]["duplicate_timestamps_removed"] == 1


def test_unparseable_timestamps_raise_input_error():
    df = pd.DataFrame(
        {
            "timestamp": ["nope", "still nope"],
            "sensor_a": [10, 20],
            "sensor_b": [30, 40],
        }
    )

    with pytest.raises(InputValidationError, match="No usable timestamps"):
        run_preprocessing_pipeline(
            df,
            "timestamp",
            ["sensor_a", "sensor_b"],
        )


def test_datetime_alignment_is_optional_and_interpolates_when_enabled():
    df = pd.DataFrame(
        {
            "timestamp": ["2026-01-01 10:00:00", "2026-01-01 10:10:00"],
            "sensor_a": [20, 30],
            "sensor_b": [40, 60],
        }
    )

    unchanged = run_preprocessing_pipeline(
        df,
        "timestamp",
        ["sensor_a", "sensor_b"],
    )
    aligned = run_preprocessing_pipeline(
        df,
        "timestamp",
        ["sensor_a", "sensor_b"],
        sampling_frequency="5min",
    )

    assert len(unchanged) == 2
    assert len(aligned) == 3
    assert aligned.loc[pd.Timestamp("2026-01-01 10:05:00"), "sensor_a"] == 25
    assert aligned.attrs["data_quality"]["rows_added_by_alignment"] == 1


def test_at_least_two_unique_streams_are_required():
    df = pd.DataFrame({"time": [1, 2], "sensor_a": [1, 2]})

    with pytest.raises(InputValidationError, match="At least 2 unique streams"):
        run_preprocessing_pipeline(df, "time", ["sensor_a", "sensor_a"])
