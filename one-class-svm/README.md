# One-class Support Vector Machine

**Authors:** Joy Jayesh Patel and Mariam Sulemana Banda

This folder contains the implementation of One-class Support Vector Machine (OC-SVM) for anomaly detection using time-series sensor data.

## 📂 Files
- `One_class_SVM.ipynb`: Jupyter Notebook with all implementations and visualizations.
- `One_class_SVM.pdf`: PDF export of the notebook.
- `complex.csv`: Input dataset containing time-series sensor readings.

## 📈 Objective
To detect anomalies in sensor data using OC-SVM. The implementation is done in two ways:

### 1. Pairwise Correlation-Based Detection
- OC-SVM is applied to pairwise correlation data between all streams.
- Helps identify anomalies in inter-stream relationships within a specific time window.

### 2. Individual Sensor-Based Detection
- OC-SVM is applied directly on the data from individual sensors.
- Useful for detecting sudden, unexpected behavior in a specific sensor's readings.

## ✅ Usage
1. Load the dataset (`complex.csv`).
2. Run through the notebook (`One_class_SVM.ipynb`) to view preprocessing, model training, and evaluation.
3. Visualizations and anomaly flags are generated within the notebook.

## ⚙️ Requirements
- Python 3.8+
- `numpy`
- `pandas`
- `matplotlib`
- `scikit-learn`
- `seaborn` (optional, for enhanced visualizations)