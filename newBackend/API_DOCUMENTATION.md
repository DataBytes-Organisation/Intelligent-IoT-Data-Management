# IoT Data Management Platform - API Documentation

## Base URL
- HTTP API: `http://localhost:3000/api`
- WebSocket: `ws://localhost:8080`

## Available Endpoints

### 1. Data Retrieval

#### GET `/streams`
Returns all sensor data entries.

**Response:**
```json
[
  {
    "created_at": "2025-03-19T15:01:59.000Z",
    "entry_id": 3242057,
    "Temperature": 22,
    "Voltage Charge": 12.51,
    "Humidity": 45
  }
]
```

#### GET `/stream-names`
Returns available stream names.

**Response:**
```json
["Temperature", "Voltage Charge", "Humidity", "Current Draw"]
```

#### POST `/filter-streams`
Filter data by stream names.

**Request Body:**
```json
{
  "streamNames": ["Temperature", "Voltage Charge"]
}
```

### 2. Correlation Analysis

#### POST `/correlations`
Perform correlation analysis on selected streams.

**Request Body:**
```json
{
  "streams": ["Temperature", "Voltage Charge", "Humidity"],
  "start_date": "2025-03-19T15:00:00.000Z",
  "end_date": "2025-03-19T16:00:00.000Z",
  "algorithm_type": "correlation",
  "threshold": 0.5
}
```

**Response:**
```json
{
  "result": {
    "Temperature": {
      "avg_corr": 0.75,
      "is_outlier": false
    }
  }
}
```

### 3. Anomaly Detection

#### POST `/anomalies`
Perform anomaly detection using ML algorithms.

**Request Body:**
```json
{
  "streams": ["Temperature", "Voltage Charge"],
  "start_date": "2025-03-19T15:00:00.000Z",
  "end_date": "2025-03-19T16:00:00.000Z",
  "algorithm_type": "z_score",
  "contamination": 0.1
}
```

**Response:**
```json
{
  "data": [
    {
      "created_at": "2025-03-19T15:01:59.000Z",
      "Temperature": 22,
      "Temperature_is_anomaly": false,
      "Temperature_z_score": 1.2
    }
  ],
  "anomaly_count": 5,
  "total_points": 100,
  "anomaly_percentage": 5.0,
  "algorithm_used": "z_score"
}
```

### 4. Data Export

#### POST `/export`
Export data in various formats.

**Request Body:**
```json
{
  "streams": ["Temperature", "Voltage Charge"],
  "start_date": "2025-03-19T15:00:00.000Z",
  "end_date": "2025-03-19T16:00:00.000Z",
  "format": "json"
}
```

**Response:** JSON data or CSV file download

### 5. System Information

#### GET `/algorithms`
Get available ML algorithms.

**Response:**
```json
{
  "correlation_algorithms": ["correlation", "mean", "volatility"],
  "anomaly_algorithms": ["isolation_forest", "z_score"]
}
```

#### GET `/statistics`
Get dataset statistics.

**Response:**
```json
{
  "total_records": 1000,
  "date_range": {
    "start": "2025-03-19T15:00:00.000Z",
    "end": "2025-03-19T16:00:00.000Z"
  },
  "sensor_stats": {
    "Temperature": {
      "mean": 22.5,
      "std": 2.1,
      "min": 18,
      "max": 28,
      "count": 1000
    }
  }
}
```

## WebSocket API

### Connection
Connect to `ws://localhost:8080`

### Message Types

#### Subscribe to Streams
```json
{
  "type": "subscribe_streams",
  "streams": ["Temperature", "Voltage Charge"]
}
```

#### Request Correlation Analysis
```json
{
  "type": "request_correlation",
  "streams": ["Temperature", "Voltage Charge"],
  "start_date": "2025-03-19T15:00:00.000Z",
  "end_date": "2025-03-19T16:00:00.000Z"
}
```

#### Request Anomaly Detection
```json
{
  "type": "request_anomaly_detection",
  "streams": ["Temperature"],
  "start_date": "2025-03-19T15:00:00.000Z",
  "end_date": "2025-03-19T16:00:00.000Z"
}
```

### Server Messages

#### Data Update
```json
{
  "type": "data_update",
  "timestamp": "2025-03-19T15:01:59.000Z",
  "message": "Real-time data update",
  "active_connections": 3
}
```

#### Initial Data
```json
{
  "type": "initial_data",
  "streams": ["Temperature", "Voltage Charge", "Humidity"],
  "message": "Connected to IoT Data Management Platform"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
