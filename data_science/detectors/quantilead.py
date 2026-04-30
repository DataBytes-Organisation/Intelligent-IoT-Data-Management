import time
import pandas as pd
from adtk.detector import QuantileAD
from adtk.data import validate_series


class QuantileADDetector:
    """
    Quantile-based anomaly detector using ADTK.
    Flags values outside specified lower and upper quantiles.
    """

    def __init__(self, high=0.95, low=0.05):
        self.high = high
        self.low = low
        self.model = QuantileAD(high=high, low=low)

    def detect(self, df):
        start_time = time.time()

        # Use first sensor column
        series = validate_series(df.iloc[:, 0])

        # Detect anomalies
        anomalies = self.model.fit_detect(series)

        # Convert to 0/1
        anomaly_flag = anomalies.fillna(0).astype(int)

        runtime = time.time() - start_time

        return {
            "model_name": "QuantileAD",
            "anomaly_flag": anomaly_flag,
            "score": anomaly_flag,  # binary score (no continuous score available)
            "runtime": runtime
        }