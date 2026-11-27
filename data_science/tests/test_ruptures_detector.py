import numpy as np
import pandas as pd
import pytest

from data_science.detector_runner import run_detector
from data_science.detectors.ruptures_detector import RupturesDetector
from data_science.input_validator import InputValidationError


@pytest.fixture
def signal():
    return pd.DataFrame(
        {"temperature": [20.] * 30 + [30.] * 40, "humidity": 45.},
        index=pd.date_range("2026-11-25", periods=70, freq="s", tz="UTC", name="timestamp"),
    )


def test_runner(signal):
    result = run_detector("ruptures", signal.reset_index())
    assert result["status"] == "success"
    assert result["timestamp"].equals(signal.index)
    assert list(result["score"][result["anomaly_flag"]]) == [2.]
    assert result["score"].idxmax() == signal.index[30]


def test_live_windows(signal):
    detector = RupturesDetector()
    assert detector.update(signal.iloc[:59]) == []
    result = detector.update(signal.iloc[59:60])
    result += detector.update(signal.iloc[60:][["humidity", "temperature"]])
    assert [window["window_end"] for window in result] == list(signal.index[[59, 69]])
    assert [window["change_points"] for window in result] == [[signal.index[30]]] * 2
    assert result == RupturesDetector().update(signal.reset_index())


@pytest.mark.parametrize("problem", ["missing", "extra", "text", "nan", "inf", "bool",
                                     "duplicate columns", "duplicate time", "missing time",
                                     "no timestamp", "late", "timezone"])
def test_bad_batch_leaves_state_intact(signal, problem):
    detector = RupturesDetector()
    detector.update(signal.iloc[:59])
    batch = signal.iloc[59:61].copy()
    if problem == "missing":
        batch = batch.drop(columns="humidity")
    elif problem == "extra":
        batch["another"] = 5.
    elif problem in ("text", "nan", "inf", "bool"):
        batch["humidity"] = {"text": "45", "nan": np.nan, "inf": np.inf, "bool": True}[problem]
    elif problem == "duplicate columns":
        batch.columns = ["humidity", "humidity"]
    elif problem == "duplicate time":
        batch.index = [batch.index[0]] * 2
    elif problem == "missing time":
        batch.index = pd.DatetimeIndex([pd.NaT, batch.index[1]])
    elif problem == "no timestamp":
        batch = batch.reset_index(drop=True)
    elif problem == "late":
        batch = signal.iloc[:1]
    else:
        batch = batch.tz_localize(None)
    with pytest.raises(InputValidationError):
        detector.update(batch)
    assert len(detector.update(signal.iloc[59:60])) == 1


def test_overrides_and_constant_signal(signal):
    detector = RupturesDetector(window_size=8, step_size=4, sensor_cols=["humidity"])
    results = detector.update(signal[["humidity"]].iloc[:16])
    assert [w["window_end"] for w in results] == list(signal.index[[7, 11, 15]])
    assert all(w["change_points"] == [] for w in results)


@pytest.mark.parametrize("parameters", [{"window_size": 3}, {"step_size": 0}, {"step_size": 61},
                                        {"penalty": -1}, {"sensor_cols": "humidity"}])
def test_bad_parameter_returns_runner_error(signal, parameters):
    assert run_detector("ruptures", signal, parameters)["status"] == "failed"
