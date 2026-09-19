"""
Representative test cases for reusable detector validation.
"""

import numpy as np
import pandas as pd

from data_science.testing.detector_test_module import DetectorTestCase


def _index(size: int) -> pd.DatetimeIndex:
    return pd.date_range(
        "2026-08-01",
        periods=size,
        freq="min",
    )


def clean_data() -> pd.DataFrame:
    """Normal sensor readings without injected anomalies."""

    return pd.DataFrame(
        {
            "temperature": np.linspace(20.0, 24.0, 20),
            "pressure": np.linspace(100.0, 104.0, 20),
        },
        index=_index(20),
    )


def obvious_anomalies() -> pd.DataFrame:
    """Normal readings containing several obvious extreme values."""

    df = clean_data().copy()

    df.loc[df.index[5], "temperature"] = 100.0
    df.loc[df.index[12], "temperature"] = -50.0
    df.loc[df.index[17], "pressure"] = 500.0

    return df


def no_anomalies() -> pd.DataFrame:
    """Stable readings where no obvious anomaly is present."""

    return pd.DataFrame(
        {
            "temperature": [22.0] * 20,
            "pressure": [101.0] * 20,
        },
        index=_index(20),
    )


def too_few_readings() -> pd.DataFrame:
    """Very small dataset used to test minimum-data behaviour."""

    return pd.DataFrame(
        {
            "temperature": [20.0, 21.0],
            "pressure": [100.0, 101.0],
        },
        index=_index(2),
    )


def missing_values() -> pd.DataFrame:
    """Dataset containing missing sensor readings."""

    df = clean_data().copy()

    df.loc[df.index[5], "temperature"] = np.nan
    df.loc[df.index[10], "pressure"] = np.nan

    return df


def invalid_values() -> pd.DataFrame:
    """Dataset containing non-numeric sensor values."""

    df = clean_data().copy()

    df["temperature"] = df["temperature"].astype(object)
    df.loc[df.index[5], "temperature"] = "invalid"

    return df


def different_sensor_scales() -> pd.DataFrame:
    """Sensors operating on substantially different numeric scales."""

    return pd.DataFrame(
        {
            "temperature": np.linspace(20.0, 24.0, 20),
            "pressure": np.linspace(100000.0, 104000.0, 20),
        },
        index=_index(20),
    )


def single_sensor() -> pd.DataFrame:
    """Single-feature sensor dataset."""

    return pd.DataFrame(
        {
            "temperature": np.linspace(20.0, 24.0, 20),
        },
        index=_index(20),
    )


def multivariate_data() -> pd.DataFrame:
    """Multiple correlated sensor metrics."""

    temperature = np.linspace(20.0, 24.0, 20)
    pressure = np.linspace(100.0, 104.0, 20)
    humidity = np.linspace(50.0, 55.0, 20)

    df = pd.DataFrame(
        {
            "temperature": temperature,
            "pressure": pressure,
            "humidity": humidity,
        },
        index=_index(20),
    )

    df.loc[df.index[15], "temperature"] = 80.0
    df.loc[df.index[15], "pressure"] = 300.0

    return df


def constant_feature() -> pd.DataFrame:
    """Dataset containing a constant sensor feature."""

    return pd.DataFrame(
        {
            "temperature": [22.0] * 20,
            "pressure": np.linspace(100.0, 104.0, 20),
        },
        index=_index(20),
    )


def representative_test_cases() -> list[DetectorTestCase]:
    """Return the standard reusable detector test suite."""

    return [
        DetectorTestCase(
            name="clean_data",
            dataframe=clean_data(),
            description="Normal sensor readings without obvious anomalies.",
        ),
        DetectorTestCase(
            name="obvious_anomalies",
            dataframe=obvious_anomalies(),
            description="Dataset containing several extreme sensor anomalies.",
        ),
        DetectorTestCase(
            name="no_anomalies",
            dataframe=no_anomalies(),
            description="Stable readings with no intentionally injected anomalies.",
        ),
        DetectorTestCase(
            name="too_few_readings",
            dataframe=too_few_readings(),
            description="Very small dataset used to test minimum-data behaviour.",
        ),
        DetectorTestCase(
            name="missing_values",
            dataframe=missing_values(),
            description="Sensor data containing NaN values.",
        ),
        DetectorTestCase(
            name="invalid_values",
            dataframe=invalid_values(),
            description="Sensor data containing a non-numeric value.",
        ),
        DetectorTestCase(
            name="different_sensor_scales",
            dataframe=different_sensor_scales(),
            description="Features with substantially different numeric scales.",
        ),
        DetectorTestCase(
            name="single_sensor",
            dataframe=single_sensor(),
            description="Single sensor metric.",
        ),
        DetectorTestCase(
            name="multivariate_data",
            dataframe=multivariate_data(),
            description="Multiple sensor metrics with a multivariate anomaly.",
        ),
        DetectorTestCase(
            name="constant_feature",
            dataframe=constant_feature(),
            description="Dataset containing a constant feature.",
        ),
    ]