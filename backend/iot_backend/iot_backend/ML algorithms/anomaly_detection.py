from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import numpy as np

class AnomalyDetector:
    def __init__(self, contamination=0.1):
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.scaler = StandardScaler()
        
    def fit(self, data):
        """Train the model on historical data"""
        scaled_data = self.scaler.fit_transform(data.reshape(-1, 1))
        self.model.fit(scaled_data)
        
    def detect_anomalies(self, data):
        """Detect anomalies in real-time data"""
        scaled_data = self.scaler.transform(data.reshape(-1, 1))
        predictions = self.model.predict(scaled_data)
        return predictions == -1  # True for anomalies, False for normal data
        
    def get_anomaly_score(self, data):
        """Get anomaly scores for the data points"""
        scaled_data = self.scaler.transform(data.reshape(-1, 1))
        return self.model.score_samples(scaled_data)