import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from data_science.development.choose_algorithm import choose_algorithm
import os
# --- Read and process sample data ---
# Assume the file 'thingspeak_dataset.csv' has the following structure:
# created_at,entry_id,field1,field2,field3,field4,field5,field6,field7,field8

script_dir   = os.path.dirname(os.path.abspath(__file__))       # .../development
project_root = os.path.abspath(os.path.join(script_dir, ".."))  # .../project_root
csv_path     = os.path.join(project_root, "datasets", "2881821.csv")

df = pd.read_csv(csv_path, parse_dates=["created_at"])
df.sort_values(by='created_at', inplace=True)
df.set_index('created_at', inplace=True)
df = df.interpolate()

print("--------------")
print("--------------",df.dtypes)
print("--------------")

# --- Example usage of the detect_outlier_streams function ---
# Choose at least 3 streams for analysis, for example: field1, field2, field3, field5
streams_to_check = ['field1', 'field2', 'field3','field6']
start_date = '2025-03-18 06:54:00'
end_date = '2025-03-18 06:58:00'

results = choose_algorithm(df, streams_to_check, start_date, end_date,0.3, 'volatility')

print("\nOutlier detection results:")
print(results)