import os
import json
import pandas as pd
from correlation_alert.main import detect_correlation_change_alert

# Output directory
OUTPUT_DIR = "correlation_alert/venura_testing/outputs/simple"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load dataset
df = pd.read_csv("datasets/simple.csv")
df.columns = df.columns.str.strip()

# Run pipeline
results = detect_correlation_change_alert(
    df=df,
    timestamp_col="time",
    selected_streams=["s1", "s2", "s3"],
    window_size=20,
    step_size=10,
    delta_threshold=0.3
)

# Save processed data
results["processed_data"].to_csv(f"{OUTPUT_DIR}/processed_data.csv")

# Save change results
pd.DataFrame(results["change_results"]).to_csv(
    f"{OUTPUT_DIR}/change_results.csv", index=False
)

# Save alerts
with open(f"{OUTPUT_DIR}/alerts.json", "w") as f:
    json.dump(results["alerts"], f, indent=4)

# Save summary
with open(f"{OUTPUT_DIR}/summary.txt", "w") as f:
    f.write("Simple Dataset Summary\n")
    f.write("=" * 40 + "\n")
    f.write(f"Rows: {len(results['processed_data'])}\n")
    f.write(f"Windows: {len(results['windows'])}\n")
    f.write(f"Change Results: {len(results['change_results'])}\n")
    f.write(f"Alerts: {len(results['alerts'])}\n")

print("✅ Simple dataset outputs saved.")