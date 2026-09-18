import numpy as np
import pandas as pd

from correlation_alert.serialization import (
    serialize_correlation_results,
    to_iso8601,
    with_iso_timestamps,
)


def test_numpy_integer_timestamp_remains_numeric():
    value = to_iso8601(np.int64(150))

    assert value == 150
    assert isinstance(value, int)


def test_datetime_timestamp_uses_contract_format():
    assert to_iso8601(pd.Timestamp("2026-08-14 10:00:00")) == "2026-08-14T10:00:00Z"


def test_record_timestamp_fields_are_serialized_without_mutating_input():
    records = [{"start_time": pd.Timestamp("2026-08-14 10:00:00"), "delta": 0.3}]

    result = with_iso_timestamps(records)

    assert result[0]["start_time"] == "2026-08-14T10:00:00Z"
    assert isinstance(records[0]["start_time"], pd.Timestamp)


def test_correlations_are_rounded_only_in_serialized_output():
    matrix = pd.DataFrame(
        [[1.0, 0.69996], [0.69996, 1.0]],
        index=["sensor_a", "sensor_b"],
        columns=["sensor_a", "sensor_b"],
    )
    records = [
        {
            "window_index": 0,
            "start_time": pd.Timestamp("2026-08-14 10:00:00"),
            "end_time": pd.Timestamp("2026-08-14 10:05:00"),
            "window_size": 2,
            "correlation_matrix": matrix,
        }
    ]

    result = serialize_correlation_results(records, precision=4)

    assert result[0]["correlation_matrix"]["sensor_a"]["sensor_b"] == 0.7
    assert matrix.loc["sensor_a", "sensor_b"] == 0.69996
