from pathlib import Path

import pandas as pd

from correlation_alert.main import detect_correlation_change_alert


DATA_DIR = Path(__file__).resolve().parents[2] / "datasets" / "nab_realtraffic"


def test_real_traffic_dataset_regression():
    data = pd.read_csv(DATA_DIR / "traffic_4stream_merged.csv")

    result = detect_correlation_change_alert(
        data,
        "timestamp",
        [
            "occupancy_t4013",
            "speed_t4013",
            "occupancy_6005",
            "speed_6005",
        ],
        window_size=30,
        step_size=5,
    )

    assert len(result["processed_data"]) == 1850
    assert len(result["windows"]) == 365
    assert len(result["changes"]) == 2184
    assert len(result["alerts"]) == 77
    assert result["processed_data"].index.min() == pd.Timestamp("2015-09-01 13:45:00")


def test_aws_negative_control_regression():
    data = pd.read_csv(DATA_DIR / "aws_control_merged.csv")

    result = detect_correlation_change_alert(
        data,
        "timestamp",
        ["ec2_cpu", "ec2_net", "elb_req"],
        window_size=30,
        step_size=5,
    )

    assert len(result["processed_data"]) == 4024
    assert len(result["windows"]) == 799
    assert len(result["changes"]) == 2394
    assert len(result["alerts"]) == 46
