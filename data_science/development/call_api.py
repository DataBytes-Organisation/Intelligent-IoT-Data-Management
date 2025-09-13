import pandas as pd
import requests

# 1. Load CSV into DataFrame (no index)
csv_path = "data_science/datasets/2881821.csv"
df = pd.read_csv(csv_path, parse_dates=["created_at"])

# 2. Convert the 'created_at' column to ISO-format strings (no duplicates)
df['created_at'] = df['created_at'].dt.strftime("%Y-%m-%dT%H:%M:%SZ")

# 3. Select only needed columns to avoid duplicate 'created_at'
records = df[["created_at", "field1", "field2", "field3"]].to_dict(orient="records")

# 4. Build the JSON payload
payload = {
    "data": records,
    "streams": ["field1", "field2", "field3"],
    "start_date": "2025-03-18 06:54:26",
    "end_date":   "2025-03-18 06:57:26"
}

# 5. Send POST request to your running Flask server
resp = requests.post("http://localhost:5000/analyze", json=payload)

# 6. Print status and JSON response
print("Status Code:", resp.status_code)
print("Response JSON:", resp.json())
