import pandas as pd

from correlation_alert.main import detect_correlation_change_alert


def test_main_combines_preprocessing_and_correlation_facades():
    df = pd.DataFrame(
        {
            "time": [1, 2, 3, 4, 5, 6],
            "sensor_a": [1, 2, 3, 4, 5, 6],
            "sensor_b": [1, 2, 3, 4, 6, 5],
        }
    )

    result = detect_correlation_change_alert(
        df,
        "time",
        ["sensor_a", "sensor_b"],
        window_size=3,
        step_size=3,
    )

    assert set(result) == {
        "processed_data",
        "windows",
        "correlation_results",
        "changes",
        "alerts",
        "skipped_pairs",
        "data_quality",
    }
    assert result["processed_data"].index.tolist() == [1, 2, 3, 4, 5, 6]
