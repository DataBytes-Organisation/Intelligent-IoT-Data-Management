import pandas as pd
import pytest

from data_science.testing.detector_test_module import (
    DetectorTestCase,
    DetectorTestModule,
)
from data_science.testing.test_cases import (
    clean_data,
    obvious_anomalies,
    invalid_values,
    missing_values,
    multivariate_data,
    no_anomalies,
    representative_test_cases,
    single_sensor,
)


def test_isolation_forest_clean_data():
    module = DetectorTestModule(
        "isolationforest",
        parameters={
            "contamination": 0.05,
            "n_estimators": 100,
            "random_state": 42,
        },
    )

    result = module.run_case(
        DetectorTestCase(
            name="clean_data",
            dataframe=clean_data(),
            description="Normal readings.",
        )
    )

    assert result["result"] == "passed"
    assert result["anomaly_count"] >= 0


def test_isolation_forest_obvious_anomalies():
    module = DetectorTestModule("isolationforest")

    result = module.run_case(
        DetectorTestCase(
            name="obvious_anomalies",
            dataframe=obvious_anomalies(),
            description="Extreme anomalies.",
        )
    )

    assert result["result"] == "passed"
    assert result["anomaly_count"] > 0


def test_isolation_forest_no_anomalies_case():
    module = DetectorTestModule(
        "isolationforest",
        parameters={"contamination": 0.05},
    )

    result = module.run_case(
        DetectorTestCase(
            name="no_anomalies",
            dataframe=no_anomalies(),
            description="Stable readings.",
        )
    )

    assert result["result"] == "passed"


def test_isolation_forest_missing_values_are_reported():
    module = DetectorTestModule("isolationforest")

    result = module.run_case(
        DetectorTestCase(
            name="missing_values",
            dataframe=missing_values(),
            description="NaN values.",
        )
    )

    assert result["result"] in {"passed", "failed"}


def test_isolation_forest_invalid_values_are_reported():
    module = DetectorTestModule("isolationforest")

    result = module.run_case(
        DetectorTestCase(
            name="invalid_values",
            dataframe=invalid_values(),
            description="Invalid non-numeric value.",
        )
    )

    assert result["result"] == "failed"
    assert "error" in result


def test_isolation_forest_multivariate_data():
    module = DetectorTestModule("isolationforest")

    result = module.run_case(
        DetectorTestCase(
            name="multivariate_data",
            dataframe=multivariate_data(),
            description="Multiple sensor metrics.",
        )
    )

    assert result["result"] == "passed"
    assert result["metrics"] == [
        "temperature",
        "pressure",
        "humidity",
    ]


def test_isolation_forest_single_sensor():
    module = DetectorTestModule("isolationforest")

    result = module.run_case(
        DetectorTestCase(
            name="single_sensor",
            dataframe=single_sensor(),
            description="Single sensor metric.",
        )
    )

    assert result["result"] == "passed"


def test_unsupported_detector_is_reported():
    module = DetectorTestModule("future_detector")

    result = module.run_case(
        DetectorTestCase(
            name="unsupported_detector",
            dataframe=pd.DataFrame(
                {"temperature": [20.0, 21.0]}
            ),
            description="Unsupported detector.",
        )
    )

    assert result["result"] == "failed"
    assert "not supported" in result["error"]


def test_representative_suite_runs():
    module = DetectorTestModule("isolationforest")

    report = module.run_cases(representative_test_cases())

    assert report["detector"] == "isolationforest"
    assert report["total_cases"] == 10
    assert len(report["results"]) == 10


@pytest.mark.parametrize(
    "dataframe",
    [
        clean_data(),
        obvious_anomalies(),
        no_anomalies(),
        multivariate_data(),
        single_sensor(),
    ],
)
def test_detector_result_contract(dataframe):
    module = DetectorTestModule("isolationforest")

    result = module.run_case(
        DetectorTestCase(
            name="contract_test",
            dataframe=dataframe,
            description="Detector result contract.",
        )
    )

    assert result["result"] == "passed"
    assert (
        result["normal_count"] + result["anomaly_count"]
        == len(dataframe)
    )