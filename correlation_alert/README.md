# Intelligent IoT Data Management – Correlation Alert API

## Overview

This module is part of the Intelligent IoT Data Management capstone project.  
The purpose of this service is to detect significant correlation changes between IoT sensor streams over time using rolling window analysis.

The system accepts time-series sensor data through a REST API, preprocesses the dataset, performs rolling-window correlation analysis, detects significant correlation changes, generates alerts, and returns the results in JSON format.

---

# System Workflow

The API receives a dataset from the client application as a CSV file upload.  
The uploaded dataset is converted into a Pandas DataFrame and passed into the preprocessing pipeline.

After preprocessing and validation, the dataset is divided into rolling windows.  
Correlation values are then calculated between selected sensor streams for each window.

The system compares correlation values between consecutive windows to identify significant behavioural changes.  
If the correlation change exceeds the configured threshold, an alert is generated and returned through the API response.

---

# Technologies Used

- Python
- Flask
- Flask-CORS
- Pandas
- NumPy
- Requests
- REST API
- Rolling Window Correlation Analysis

---

# Folder Structure

```text
correlation_alert/
│
├── server.py
├── main.py
├── final_pipeline.py
├── preprocessing/
├── rolling_window/
├── correlation/
├── alert_generation/
├── datasets/
└── README.md
```

---

# Features Implemented

## REST API Service

A Flask API service was implemented to expose the correlation alert pipeline through HTTP endpoints.

### Implemented Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | GET | Checks whether the API service is running |
| `/detect-correlation-alert` | POST | Runs the full correlation alert pipeline |

---

# API Status Endpoint

## Endpoint

```http
GET /api/status
```

## Purpose

Used to verify that the API server is active and running successfully.

## Example Response

```json
{
  "status": "running",
  "message": "Correlation Alert Service is running.",
  "service": "correlation-alert-api"
}
```

---

# Correlation Alert Endpoint

## Endpoint

```http
POST /detect-correlation-alert
```

## Purpose

Runs the full correlation alert detection pipeline on uploaded sensor data.

---

# Input Methods

The API currently supports:

- JSON sensor records
- CSV file upload

---

# CSV Upload Implementation

The API accepts a CSV file uploaded using `multipart/form-data`.

The uploaded CSV file is:

1. Read using Pandas
2. Converted into a DataFrame
3. Cleaned and validated
4. Sent into the correlation pipeline

---

# Expected CSV Format

```csv
time,s1,s2,s3
2026-01-01 00:00:00,10,20,30
2026-01-01 00:01:00,11,19,31
2026-01-01 00:02:00,12,18,32
```

---

# Request Parameters

| Parameter | Type | Description |
|---|---|---|
| `file` | CSV File | Uploaded dataset |
| `timestamp_col` | String | Timestamp column name |
| `selected_streams` | List | Sensor columns to analyse |
| `window_size` | Integer | Rolling window size |
| `step_size` | Integer | Sliding window step |
| `method` | String | Correlation method |

---

# Supported Correlation Methods

| Method |
|---|
| Pearson |
| Spearman |

---

# Example Postman Configuration

## Method

```text
POST
```

## URL

```text
http://127.0.0.1:5001/detect-correlation-alert
```

## Body Type

```text
form-data
```

## Form Data Fields

| Key | Value |
|---|---|
| file | Upload CSV |
| timestamp_col | time |
| selected_streams | s1,s2,s3 |
| window_size | 20 |
| step_size | 10 |
| method | pearson |

---

# Pipeline Architecture

The system pipeline is divided into several stages.

---

# Stage 1 – Data Loading

The uploaded CSV file is loaded into a Pandas DataFrame.

### Implemented Operations

- Read CSV file
- Strip column spaces
- Validate dataset structure

---

# Stage 2 – Data Preprocessing

The preprocessing stage cleans and validates the dataset before analysis.

## Operations Performed

### Timestamp Sorting

The dataset is sorted using the timestamp column.

```python
sort_values(by=timestamp_col)
```

---

### Numeric Conversion

Sensor columns are converted into numeric format.

```python
pd.to_numeric()
```

---

### Missing Value Handling

Missing values are detected and handled.

### Logs Generated

```text
[MISSING] Missing values before: X
[MISSING] Missing values after: Y
```

---

### Outlier Detection

Outliers are identified and replaced.

### Logs Generated

```text
[OUTLIERS] Replaced X outlier values
```

---

### Final Validation

The processed dataset is validated before moving into rolling-window analysis.

### Logs Generated

```text
[VALIDATE] Dataset is sorted, clean, and ready for correlation analysis
```

---

# Stage 3 – Rolling Window Generation

The cleaned dataset is divided into rolling windows.

## Purpose

This allows the system to analyse how correlations change over time instead of calculating a single correlation value for the entire dataset.

---

# Rolling Window Parameters

| Parameter | Description |
|---|---|
| `window_size` | Number of rows per window |
| `step_size` | Window movement interval |

---

# Example

```text
Window 1 uses rows 0–19
Window 2 uses rows 10–29
Window 3 uses rows 20–39
```

---

# Stage 4 – Correlation Analysis

Correlation values are calculated for each rolling window.

## Implemented Functionality

- Pairwise stream correlation
- Pearson correlation
- Spearman correlation

---

# Example Correlation Output

```json
{
  "window_index": 1,
  "stream_1": "s1",
  "stream_2": "s2",
  "correlation": 0.94
}
```

---

# Stage 5 – Correlation Change Detection

The system compares correlation values between consecutive windows.

## Purpose

This stage detects significant changes in relationships between sensor streams.

---

# Delta Correlation Formula

```text
Delta = Current Correlation - Previous Correlation
```

---

# Example

| Previous | Current | Delta |
|---|---|---|
| 0.92 | 0.31 | -0.61 |

A large delta indicates a major behavioural change between sensors.

---

# Stage 6 – Alert Generation

Alerts are generated when correlation changes exceed predefined thresholds.

---

# Alert Severity Levels

| Severity | Description |
|---|---|
| LOW | Small correlation change |
| MEDIUM | Moderate correlation change |
| HIGH | Significant correlation change |

---

# Example Alert

```json
{
  "alert_level": "HIGH",
  "stream_1": "s1",
  "stream_2": "s2",
  "previous_corr": 0.91,
  "current_corr": 0.24,
  "delta": -0.67,
  "window_index": 5,
  "reason": "Significant correlation drop detected."
}
```

---

# API Response Structure

## Example Response

```json
{
  "status": "success",
  "summary": {
    "processed_rows": 1008,
    "windows": 99,
    "correlation_results": 297,
    "changes": 198,
    "alerts": 12
  },
  "alerts": [],
  "changes": [],
  "correlations": []
}
```

---

# Functions Implemented

## `detect_correlation_change_alert()`

Main orchestration function for the entire pipeline.

### Responsibilities

- Preprocessing
- Rolling window generation
- Correlation analysis
- Change detection
- Alert generation

---

# `api_status()`

Returns the running status of the API.

---

# `detect_correlation_alert_api()`

Main API endpoint function.

### Responsibilities

- Receive request
- Validate input
- Read uploaded CSV
- Execute pipeline
- Return JSON response

---

# Logging Implemented

The system includes console logs for debugging and validation.

## Example Logs

```text
[TIMESTAMPS] Sorted by 'time'
[NUMERIC] Converted sensor columns to numeric: ['s1', 's2', 's3']
[MISSING] Missing values before: 0
[MISSING] Missing values after: 0
[OUTLIERS] Replaced 0 outlier values
[VALIDATE] Dataset is sorted, clean, and ready for correlation analysis
```

---

# Testing Completed

## API Testing

Successfully tested using:

- Browser
- Postman
- Python Requests Library

---

# Example Python API Test

```python
import requests

response = requests.post(
    "http://127.0.0.1:5001/detect-correlation-alert",
    files={"file": open("complex.csv", "rb")},
    data={
        "timestamp_col": "time",
        "selected_streams": "s1,s2,s3",
        "window_size": 20,
        "step_size": 10,
        "method": "pearson"
    }
)

print(response.json())
```

---

# Current System Capabilities

The implemented system can currently:

- Accept uploaded CSV datasets
- Preprocess IoT sensor data
- Create rolling windows
- Calculate correlations
- Detect correlation changes
- Generate alerts
- Return structured JSON responses
- Be tested through Postman or external applications

---

# Postman Collection

A Postman collection is included to test and demonstrate the Correlation Alert API.

## Collection File

```text
postman/IIoDT.postman_collection.json
```

## Included Requests

| Request | Method | Endpoint | Purpose |
|---|---|---|---|
| Detect Correlation Alert | POST | `/detect-correlation-alert` | Uploads a CSV dataset and runs the correlation alert pipeline |
| Check Service Status | GET | `/service-status` | Checks whether the Flask API service is running |

## Detect Correlation Alert Request

This request uses `multipart/form-data` to upload a CSV dataset and send pipeline parameters.

### Form Data Fields

| Key | Type | Example |
|---|---|---|
| `file` | File | `complex.csv` |
| `timestamp_col` | Text | `time` |
| `selected_streams` | Text | `s1,s2,s3` |
| `window_size` | Text | `20` |
| `step_size` | Text | `10` |
| `method` | Text | `pearson` |

## Importing the Collection

1. Open Postman
2. Click Import
3. Select `IIoDT.postman_collection.json`
4. Run `Check Service Status` to verify the API is running
5. Run `Detect Correlation Alert` after selecting the CSV file

## Notes

The collection also includes a Postman visualizer script for displaying correlation matrix values as a heatmap-style output from the API response.

