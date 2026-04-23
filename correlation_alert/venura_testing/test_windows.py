import pandas as pd
from correlation_alert.main import preprocess_timeseries, create_rolling_windows

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
    "sensor_b": [20, 21, 22, 23, 24, 25]
})

processed = preprocess_timeseries(
    sample_df,
    timestamp_col="timestamp",
    selected_streams=["sensor_a", "sensor_b"]
)

windows = create_rolling_windows(
    processed,
    window_size=3,
    step_size=2
)

print(f"Number of windows: {len(windows)}\n")

for i, window in enumerate(windows, start=1):
    print(f"Window {i}:")
    print(window)
    print("-" * 40)