import numpy as np
import pandas as pd
import time


class ThresholdADDetector:
    def __init__(self, threshold=3.0):
        self.threshold = threshold
        self.model_name = "ThresholdADDetector"

    def detect(self, df):
        start_time = time.time()

        # Z-score normalization
        means = df.mean()
        stds = df.std().replace(0, 1)
        z_scores = (df - means) / stds

        # Detect anomalies (CORRECT)
        anomaly_mask = np.abs(z_scores) > self.threshold

        # Convert to binary
        anomaly_flag = anomaly_mask.any(axis=1).astype(int)

        # Score
        scores = np.abs(z_scores).mean(axis=1)

        runtime = time.time() - start_time

        return {
            "model_name": self.model_name,
            "timestamp": df.index,
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime,
        }
