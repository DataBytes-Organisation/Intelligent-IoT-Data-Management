## Features
- Time series data retrieval  
- Correlation analysis with sliding time windows  
- Anomaly detection based on correlation patterns  
- `get_time_series` function for loading and preprocessing time series 
data

 # get_time_series.py

##  Overview

This script is part of the **Intelligent IoT Data Management** capstone project.  
It extracts and prepares time-series sensor data from CSV files using **row indices** instead of timestamps. The output is structured and exported for downstream use in correlation analysis and web-based dashboards.

##  What It Does

- Loads a CSV dataset (e.g., `complex.csv`)
- Keeps only numeric sensor columns (e.g., `s1`, `s2`, `s3`)
- Uses **row indices** to define the time window (e.g., from row 250 to 500)
- Exports the cleaned slice to:
  - `complex_slice.csv` 
  - `complex_slice.json`

##  How to Run

1. Place your dataset (e.g., `complex.csv`) in the appropriate folder (`datasets/`)
2. Open a terminal and run:
   ```bash
   cd development
   python get_time_series.py


# 
Intelligent-IoT-Data-Management
