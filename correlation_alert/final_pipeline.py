import pandas as pd
import requests

df = pd.read_csv("../datasets/complex.csv")
df.columns = df.columns.str.strip()

payload = {
    "data": df.to_dict(orient="records"),
    "timestamp_col": "time",
    "selected_streams": ["s1", "s2", "s3"],
    "window_size": 20,
    "step_size": 10,
    "method": "pearson"
}

response = requests.post(
    "http://127.0.0.1:5001/detect-correlation-alert",
    json=payload
)

result = response.json()

print("\n========== API RESPONSE SUMMARY ==========")
print("Status:", result.get("status"))

summary = result.get("summary", {})
print("\nSummary:")
print(f"Processed rows       : {summary.get('processed_rows')}")
print(f"Rolling windows      : {summary.get('windows')}")
print(f"Correlation results  : {summary.get('correlation_results')}")
print(f"Change comparisons   : {summary.get('changes')}")
print(f"Alerts generated     : {summary.get('alerts')}")

print("\n========== SAMPLE ALERTS ==========")

alerts = result.get("alerts", [])

if not alerts:
    print("No alerts generated.")
else:
    for i, alert in enumerate(alerts[:5], start=1):
        print(f"\nAlert {i}")
        print(f"Severity       : {alert.get('alert_level')}")
        print(f"Sensor Pair    : {alert.get('stream_1')} - {alert.get('stream_2')}")
        print(f"Previous Corr  : {alert.get('previous_corr')}")
        print(f"Current Corr   : {alert.get('current_corr')}")
        print(f"Delta          : {alert.get('delta')}")
        print(f"Window Index   : {alert.get('window_index')}")
        print(f"Reason         : {alert.get('reason')}")