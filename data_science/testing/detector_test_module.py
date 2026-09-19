"""
Reusable detector testing module.

Provides a common testing process for anomaly detectors through the
existing detector_runner interface.

The module is intentionally detector-agnostic. Isolation Forest is the
first supported detector, but future detectors can use the same testing
process once they are registered with detector_runner.
"""

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from data_science.detector_runner import run_detector


@dataclass
class DetectorTestCase:
    """A single reusable detector test scenario."""

    name: str
    dataframe: pd.DataFrame
    description: str
    parameters: dict[str, Any] = field(default_factory=dict)


class DetectorTestModule:
    """
    Execute representative test scenarios through the existing detector
    runner and produce structured results.

    The module does not instantiate detector implementations directly.
    This keeps detector selection and construction inside detector_runner.
    """

    REQUIRED_RESULT_FIELDS = {
        "status",
        "model_name",
        "anomaly_flag",
        "score",
        "timestamp",
        "runtime",
    }

    def __init__(
        self,
        detector_name: str,
        parameters: dict[str, Any] | None = None,
    ):
        self.detector_name = detector_name
        self.parameters = parameters or {}

    def run_case(self, test_case: DetectorTestCase) -> dict[str, Any]:
        """Run one test case through the existing detector runner."""

        result = run_detector(
            self.detector_name,
            test_case.dataframe,
            parameters=test_case.parameters or self.parameters,
        )

        test_result = {
            "name": test_case.name,
            "description": test_case.description,
            "detector": self.detector_name,
            "parameters": test_case.parameters or self.parameters,
            "status": result.get("status"),
        }

        if result.get("status") != "success":
            test_result.update(
                {
                    "result": "failed",
                    "error": result.get("error", "Unknown detector error"),
                }
            )
            return test_result

        validation = self._validate_result(
            result,
            expected_length=len(test_case.dataframe),
        )

        test_result.update(validation)

        return test_result

    def run_cases(
        self,
        test_cases: list[DetectorTestCase],
    ) -> dict[str, Any]:
        """Run multiple detector test cases."""

        results = [self.run_case(case) for case in test_cases]

        passed = sum(
            result["result"] == "passed"
            for result in results
        )

        failed = sum(
            result["result"] == "failed"
            for result in results
        )

        return {
            "detector": self.detector_name,
            "parameters": self.parameters,
            "total_cases": len(results),
            "passed": passed,
            "failed": failed,
            "results": results,
        }

    def _validate_result(
        self,
        result: dict[str, Any],
        expected_length: int,
    ) -> dict[str, Any]:
        """Validate the common detector result contract."""

        missing_fields = self.REQUIRED_RESULT_FIELDS.difference(result)

        if missing_fields:
            return {
                "result": "failed",
                "error": (
                    "Missing required result fields: "
                    + ", ".join(sorted(missing_fields))
                ),
            }

        anomaly_flag = result["anomaly_flag"]
        score = result["score"]
        timestamp = result["timestamp"]

        if len(anomaly_flag) != expected_length:
            return {
                "result": "failed",
                "error": "anomaly_flag length does not match input data",
            }

        if len(score) != expected_length:
            return {
                "result": "failed",
                "error": "score length does not match input data",
            }

        if len(timestamp) != expected_length:
            return {
                "result": "failed",
                "error": "timestamp length does not match input data",
            }

        if not pd.api.types.is_bool_dtype(anomaly_flag):
            return {
                "result": "failed",
                "error": "anomaly_flag must contain boolean values",
            }

        if not pd.api.types.is_numeric_dtype(score):
            return {
                "result": "failed",
                "error": "score must contain numeric values",
            }

        anomaly_count = int(anomaly_flag.sum())

        return {
            "result": "passed",
            "anomaly_count": anomaly_count,
            "normal_count": expected_length - anomaly_count,
            "score_min": float(score.min()),
            "score_max": float(score.max()),
            "runtime": float(result["runtime"]),
            "metrics": list(result.get("metrics", [])),
        }