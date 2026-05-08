import pandas as pd
from main import detect_correlation_change_alert

# df = pd.DataFrame({
#     "timestamp": pd.date_range(start="2026-01-01", periods=100, freq="min"),
#     "sensor_1": list(range(100)),
#     "sensor_2": list(range(0, 200, 2)),
#     "sensor_3": list(range(50)) + list(range(50, 0, -1))
# })
# df = pd.read_csv("datasets/2881821.csv")
df = pd.read_csv("../datasets/complex.csv")
df.columns = df.columns.str.strip()

result = detect_correlation_change_alert(
    df=df,
    timestamp_col="time",
    selected_streams=["s1", "s2", "s3"],
    window_size=20,
    step_size=10
)

print("Processed data:", result["processed_data"].shape)
print("Windows:", len(result["windows"]))
print("Correlation results:", len(result["correlation_results"]))
print("Changes:", len(result["changes"]))
print("Alerts:", len(result["alerts"]))

print("\nSample alert:")
print(result["alerts"][:3])
