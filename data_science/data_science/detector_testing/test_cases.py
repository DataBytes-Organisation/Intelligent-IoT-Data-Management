import numpy as np
import pandas as pd


def normal_data():
    np.random.seed(42)

    return pd.DataFrame({
        "sensor_1": np.random.normal(20, 1, 100),
        "sensor_2": np.random.normal(50, 2, 100),
        "sensor_3": np.random.normal(100, 5, 100)
    })


def obvious_anomalies():
    df = normal_data()

    anomalies = pd.DataFrame({
        "sensor_1": [100, -100, 150],
        "sensor_2": [300, -200, 400],
        "sensor_3": [1000, -500, 1500]
    })

    return pd.concat([df, anomalies], ignore_index=True)


def no_anomalies():
    return pd.DataFrame({
        "sensor_1": [20.0] * 50,
        "sensor_2": [50.0] * 50,
        "sensor_3": [100.0] * 50
    })


def too_few_readings():
    return pd.DataFrame({
        "sensor_1": [20.0, 21.0],
        "sensor_2": [50.0, 51.0],
        "sensor_3": [100.0, 101.0]
    })


def missing_values():
    df = normal_data()

    df.loc[5, "sensor_1"] = np.nan
    df.loc[10, "sensor_2"] = np.nan

    return df


def invalid_values():
    df = normal_data().astype(object)

    df.loc[0, "sensor_1"] = "invalid"

    return df


def different_sensor_scales():
    np.random.seed(42)

    return pd.DataFrame({
        "small_sensor": np.random.normal(0.01, 0.001, 100),
        "medium_sensor": np.random.normal(100, 5, 100),
        "large_sensor": np.random.normal(100000, 5000, 100)
    })
