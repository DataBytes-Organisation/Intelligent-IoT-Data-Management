import pandas as pd
from correlation_alert.main import detect_correlation_change_alert

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

results = detect_correlation_change_alert(
    df=sample_df,
    timestamp_col="timestamp",
    selected_streams=["sensor_a", "sensor_b", "sensor_c"],
    window_size=4,
    step_size=2,
    delta_threshold=0.3
)

print("=== Processed Data ===")
print(results["processed_data"])
print()

print("=== Number of Windows ===")
print(len(results["windows"]))
print()

print("=== Correlation Results ===")
for item in results["correlation_results"]:
    print(f"Window {item['window_index']}:")
    print(item["correlation_matrix"])
    print()

print("=== Change Results ===")
for item in results["change_results"]:
    print(item)
print()

print("=== Alerts ===")
for alert in results["alerts"]:
    print(alert)