import pandas as pd
import pytest

from correlation_alert.correlation import (
    InputValidationError,
    VALID_METHODS,
    compare_correlation_changes,
    compute_window_correlations,
    create_rolling_windows,
    generate_alerts,
    run_correlation_pipeline,
)


def _matrix(value):
    return pd.DataFrame(
        [[1.0, value], [value, 1.0]],
        index=["sensor_a", "sensor_b"],
        columns=["sensor_a", "sensor_b"],
    )


def _change(previous_corr, current_corr):
    return {
        "window_index": 1,
        "start_time": 1,
        "end_time": 2,
        "stream_1": "sensor_a",
        "stream_2": "sensor_b",
        "previous_corr": previous_corr,
        "current_corr": current_corr,
        "delta": abs(current_corr - previous_corr),
    }


@pytest.mark.parametrize(
    ("window_size", "step_size"),
    [(0, 1), (-1, 1), (2, 0), (2, -1)],
)
def test_window_parameters_must_be_positive(window_size, step_size):
    df = pd.DataFrame({"sensor_a": [1, 2, 3], "sensor_b": [2, 4, 6]})

    with pytest.raises(InputValidationError):
        create_rolling_windows(df, window_size, step_size)


@pytest.mark.parametrize("method", ["pearson", "spearman"])
def test_supported_method_computes_correlation_matrix(method):
    window = pd.DataFrame(
        {
            "sensor_a": [1, 2, 3],
            "sensor_b": [2, 4, 6],
        }
    )

    result = compute_window_correlations([window], method=method)

    matrix = result[0]["correlation_matrix"]
    assert matrix.loc["sensor_a", "sensor_b"] == pytest.approx(1.0)


def test_supported_methods_match_service_contract():
    assert VALID_METHODS == {"pearson", "spearman"}


def test_sign_reversal_between_strong_correlations_is_high():
    alerts = generate_alerts([_change(-0.8, 0.8)])

    assert alerts[0]["alert_level"] == "HIGH"
    assert "changed by" in alerts[0]["reason"]


def test_raw_correlations_are_used_for_threshold_decisions():
    results = [
        {
            "window_index": 0,
            "start_time": 0,
            "end_time": 1,
            "correlation_matrix": _matrix(0.69996),
        },
        {
            "window_index": 1,
            "start_time": 1,
            "end_time": 2,
            "correlation_matrix": _matrix(0.39996),
        },
    ]

    changes, skipped_pairs = compare_correlation_changes(results)
    alerts = generate_alerts(changes)

    assert skipped_pairs == []
    assert changes[0]["previous_corr"] == pytest.approx(0.69996)
    assert changes[0]["current_corr"] == pytest.approx(0.39996)
    assert alerts[0]["alert_level"] == "LOW"
    assert "Strong-to-weak" not in alerts[0]["reason"]


def test_undefined_correlations_are_reported_as_skipped_pairs():
    results = [
        {
            "window_index": 0,
            "start_time": 0,
            "end_time": 1,
            "correlation_matrix": _matrix(float("nan")),
        },
        {
            "window_index": 1,
            "start_time": 1,
            "end_time": 2,
            "correlation_matrix": _matrix(0.5),
        },
    ]

    changes, skipped_pairs = compare_correlation_changes(results)

    assert changes == []
    assert skipped_pairs[0]["reason"] == "undefined_correlation"


def test_correlation_facade_returns_every_pipeline_stage():
    index = pd.date_range("2026-01-01", periods=6, freq="min")
    df = pd.DataFrame(
        {
            "sensor_a": [1, 2, 3, 4, 5, 6],
            "sensor_b": [1, 2, 3, 4, 6, 5],
        },
        index=index,
    )

    result = run_correlation_pipeline(df, window_size=3, step_size=3)

    assert set(result) == {
        "windows",
        "correlation_results",
        "changes",
        "alerts",
        "skipped_pairs",
    }
    assert len(result["windows"]) == 2
    assert len(result["changes"]) == 1
