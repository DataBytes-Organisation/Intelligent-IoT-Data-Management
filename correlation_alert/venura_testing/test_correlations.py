import pandas as pd
from correlation_alert.main import (
    preprocess_timeseries,
    create_rolling_windows,
    compute_window_correlations
)

sample_df = pd.DataFrame({
    "timestamp": [
        "2026-04-21 10:00:00",
        "2026-04-21 10:01:00",
        "2026-04-21 10:02:00",
        "2026-04-21 10:03:00",
        "2026-04-21 10:04:00",
        "2026-04-21 10:05:00"
    ],
    "sensor_a": [10, 11, 12, 13, 14, 15],
    "sensor_b": [20, 22, 24, 26, 28, 30],
    "sensor_c": [30, 29, 28, 27, 26, 25]
})

processed = preprocess_timeseries(
    sample_df,
    timestamp_col="timestamp",
    selected_streams=["sensor_a", "sensor_b", "sensor_c"]
)

windows = create_rolling_windows(
    processed,
    window_size=3,
    step_size=2
)

correlation_results = compute_window_correlations(windows)

print(f"Number of correlation results: {len(correlation_results)}\n")

for result in correlation_results:
    print(f"Window Index: {result['window_index']}")
    print(f"Start Time: {result['start_time']}")
    print(f"End Time: {result['end_time']}")
    print("Correlation Matrix:")
    print(result["correlation_matrix"])
    print("-" * 50)