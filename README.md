# Intelligent-IoT-Data-Management

## Isolation Forest for Anomaly Detection
- Branch: feature/isolation-forest
- Module Path: isolation_forest/

This module implements an Isolation Forest-based anomaly detection pipeline tailored for multivariate IoT sensor data. It is part of the broader Intelligent IoT Data Management project and helps detect unexpected behavior in time-series sensor streams.

### Features
* Applies Isolation Forest independently to each sensor (s1, s2, s3).
* Uses rolling statistics (mean, std, lag1, lag2) as temporal features.
* Flags sensor-specific anomalies.

### Includes
* Anomaly tagging per sensor
* Interactive Plotly visualization (per sensor)
* Combined Matplotlib visualization of all sensors

### Use Cases
* Anomaly detection in sensor-driven systems
* Predictive maintenance
* Real-time monitoring in smart environments



