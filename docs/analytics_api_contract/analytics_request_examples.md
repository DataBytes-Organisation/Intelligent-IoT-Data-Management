## 1. Time-Series Request (Models)

This example shows a sample request prepared by the Analytics Integration service for the Models service for anomaly detection using time-series sensor data.

# Example

```json
{
  "timestamp_col": "timestamp",
  "data": [
    {
      "timestamp": "2026-07-31T20:30:00+10:00",
      "temperature": 28.5,
      "humidity": 65.2
    },
    {
      "timestamp": "2026-07-31T20:35:00+10:00",
      "temperature": 29.1,
      "humidity": 64.8
    }
  ],
  "detector": "IsolationForest",
  "parameters": {
    "contamination": 0.05
  }
}

# Field Description

Field          Description
|--------------|-------------|
timestamp_col  Shows the timestamp column.
data           Time-series sensor data.
detector       Detector used for anomaly detection.
parameters     Optional detector settings.

## 2. Multi-Sensor Request (Correlation)

This example shows a sample request prepared by the Analytics Integration service for the Correlation service.

# Example

```json
{
  "data": [
    {
      "timestamp": "2026-07-31T20:30:00+10:00",
      "temperature": 28.5,
      "humidity": 65.2
    }
  ],
  "timestamp_col": "timestamp",
  "selected_streams": [
    "temperature",
    "humidity"
  ],
  "window_size": 10,
  "step_size": 5,
  "method": "Pearson"
}
```

# Field Description
 
 Field                 Description
|--------------------|-------------|
timestamp_col         Shows the timestamp column.
selected_streams       Sensors to compare.
data                   time-series sensor data.
window_size            Number of readings in each window.
step_size              Number of readings between windows
method                 Correlation method.

## 3. ThingSpeak-style Request

This example shows data received from a ThingSpeak channel.

# Example

```json
{
  "channel_id": 123456,
  "field1": 28.5,
  "field2": 65.2,
  "created_at": "2026-07-31T20:30:00+10:00"
}
```

# Field Description

 Field        Description 
------------|-------------|
 channel_id   Channel ID. 
 field1       First sensor value. 
 field2       Second sensor value. 
 created_at   Time of the data. 



 ## 4. Field Summary

# Required Fields

- data
- timestamp_col
- detector
- selected_streams
- window_size
- step_size
- method

# Optional Fields

- parameters

# Models Service Fields

- data
- timestamp_col
- detector
- parameters

# Correlation Service Fields

- data
- timestamp_col
- selected_streams
- window_size
- step_size
- method



## 5. How the Request is Prepared

# Models Request

- The Backend provides the sensor data to the Analytics Integration service.
- Analytics Integration prepares the request with the sensor data.
- The request is then sent to the Models service.

# Correlation Request

- The Backend provides data from multiple sensors to the Analytics Integration service.
- Analytics Integration prepares one request with the sensor data.
- The request is then sent to the Correlation service.

# ThingSpeak Request

- The Backend gets data from a ThingSpeak channel.
- It reads the sensor values.
- The data is used for analysis.

## 6. Request Structure

 The request examples use a simple JSON format. This makes it easier for the Backend, Models, and Correlation services to share data. The same structure can also be used for future integration.