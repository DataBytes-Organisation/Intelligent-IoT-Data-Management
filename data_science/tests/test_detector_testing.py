from data_science.detector_testing.tester import DetectorTester

from data_science.detector_testing.test_cases import (
    normal_data,
    obvious_anomalies,
    no_anomalies,
    too_few_readings,
    missing_values,
    invalid_values,
    different_sensor_scales,
)


tester = DetectorTester("isolationforest")


def test_normal_data():
    result = tester.test_case(
        "normal_data",
        normal_data()
    )

    assert result["status"] == "success"
    assert result["result"]["model_name"] == "IsolationForest"


def test_obvious_anomalies():
    result = tester.test_case(
        "obvious_anomalies",
        obvious_anomalies(),
        {"contamination": 0.05}
    )

    assert result["status"] == "success"
    assert result["result"]["anomaly_flag"].sum() > 0


def test_no_anomalies():
    result = tester.test_case(
        "no_anomalies",
        no_anomalies()
    )

    assert result["status"] == "success"


def test_too_few_readings():
    result = tester.test_case(
        "too_few_readings",
        too_few_readings()
    )

    assert result["status"] in ["success", "failed"]


def test_missing_values():
    result = tester.test_case(
        "missing_values",
        missing_values()
    )

    assert result["status"] == "failed"
    assert "error" in result["result"]


def test_invalid_values():
    result = tester.test_case(
        "invalid_values",
        invalid_values()
    )

    assert result["status"] == "failed"
    assert "error" in result["result"]


def test_different_sensor_scales():
    result = tester.test_case(
        "different_sensor_scales",
        different_sensor_scales()
    )

    assert result["status"] == "success"


def test_configuration():
    result = tester.test_case(
        "different_configuration",
        normal_data(),
        {
            "contamination": 0.10,
            "n_estimators": 50,
            "random_state": 42
        }
    )

    assert result["status"] == "success"
    assert result["result"]["model_name"] == "IsolationForest"
