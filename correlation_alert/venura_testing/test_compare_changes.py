import pandas as pd
from correlation_alert.main import (
    preprocess_timeseries,
    create_rolling_windows,
    compute_window_correlations,
    compare_correlation_changes
)

sample_df = pd.DataFrame({
    "timestamp": [
        "2026-04-21 10:00:00",
        "2026-04-21 10:01:00",
        "2026-04-21 10:02:00",
        "2026-04-21 10:03:00",
        "2026-04-21 10:04:00",
        "2026-04-21 10:05:00",
        "2026-04-21 10:06:00",
        "2026-04-21 10:07:00"
    ],
    "sensor_a": [10, 11, 12, 13, 14, 15, 16, 17],
    "sensor_b": [20, 22, 24, 26, 20, 19, 18, 17],
    "sensor_c": [30, 29, 28, 27, 26, 25, 24, 23]
})

processed = preprocess_timeseries(
    sample_df,
    timestamp_col="timestamp",
    selected_streams=["sensor_a", "sensor_b", "sensor_c"]
)

windows = create_rolling_windows(
    processed,
    window_size=4,
    step_size=2
)

correlation_results = compute_window_correlations(windows)
change_results = compare_correlation_changes(correlation_results)

print(f"Number of change records: {len(change_results)}\n")

for change in change_results:
    print(change)