import pandas as pd
from correlation_alert.main import preprocess_timeseries

sample_df = pd.DataFrame({
    "timestamp": [
        "2026-04-21 10:00:00",
        "2026-04-21 10:01:00",
        "2026-04-21 10:02:00"
    ],
    "sensor_a": [10, None, 14],
    "sensor_b": [20, 21, None]
})

processed = preprocess_timeseries(
    sample_df,
    timestamp_col="timestamp",
    selected_streams=["sensor_a", "sensor_b"]
)

print(processed)