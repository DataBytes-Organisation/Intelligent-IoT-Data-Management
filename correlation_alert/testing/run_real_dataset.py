import json
import pandas as pd
from correlation_alert.main import detect_correlation_change_alert

OUTPUT_DIR = "correlation_alert/venura_testing/outputs"

df = pd.read_csv("datasets/2881821.csv")
df.columns = df.columns.str.strip()

results = detect_correlation_change_alert(
    df=df,
    timestamp_col="created_at",
    selected_streams=[
        "field1", "field2", "field3", "field4",
        "field5", "field6", "field7", "field8"
    ],
    window_size=10,
    step_size=5,
    delta_threshold=0.3
)

# Save processed data
results["processed_data"].to_csv(f"{OUTPUT_DIR}/real_processed_data.csv")

# Save change results
change_results_df = pd.DataFrame(results["change_results"])
change_results_df.to_csv(f"{OUTPUT_DIR}/real_change_results.csv", index=False)

# Save alerts
with open(f"{OUTPUT_DIR}/real_alerts.json", "w") as f:
    json.dump(results["alerts"], f, indent=4)

# Save summary
with open(f"{OUTPUT_DIR}/real_summary.txt", "w") as f:
    f.write("Correlation Change Alert Pipeline - Real Dataset\n")
    f.write("=" * 50 + "\n")
    f.write(f"Processed rows: {len(results['processed_data'])}\n")
    f.write(f"Number of windows: {len(results['windows'])}\n")
    f.write(f"Number of correlation results: {len(results['correlation_results'])}\n")
    f.write(f"Number of change results: {len(results['change_results'])}\n")
    f.write(f"Number of alerts: {len(results['alerts'])}\n")

print("Real dataset outputs saved successfully.")