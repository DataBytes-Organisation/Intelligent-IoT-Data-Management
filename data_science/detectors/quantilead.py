# QuantileAD detector implementation 
import time
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

        # NOTE:
        # Currently using only the first feature (s1) for anomaly detection.
        # This is a simplified v1 approach.
        # Future improvement: apply QuantileAD across all columns
        # and combine results (e.g., OR condition across features).
        if df is None or df.shape[1] == 0:
            raise ValueError("Input DataFrame must contain at least one column.")

        # Use first sensor column
        series = validate_series(df.iloc[:, 0])

        # Detect anomalies
        anomalies = self.model.fit_detect(series)

        # Ensure boolean output (True/False)
        anomaly_flag = anomalies.fillna(False).astype(bool)

        runtime = time.time() - start_time

        return {
            "model_name": "QuantileAD",
            "timestamp": df.index,  
            "anomaly_flag": anomaly_flag,
            # Binary score since QuantileAD does not provide continuous scores
            "score": anomaly_flag,
            "runtime": runtime
        }