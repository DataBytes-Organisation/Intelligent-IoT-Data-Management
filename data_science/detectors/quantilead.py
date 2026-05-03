import time
from adtk.detector import QuantileAD
from adtk.data import validate_series


class QuantileADDetector:
    """
    Quantile-based anomaly detector using ADTK.

    Flags values that fall outside the specified lower and upper quantile range.
    """

    def __init__(self, high=0.95, low=0.05):
        # Upper and lower quantile thresholds
        self.high = high
        self.low = low

        # Initialize ADTK QuantileAD model
        self.model = QuantileAD(high=high, low=low)

        # Model name for reporting
        self.name = "QuantileADDetector"

    def detect(self, df):
        start_time = time.time()

        # Validate input DataFrame
        if df is None or df.shape[1] == 0:
            raise ValueError("Input DataFrame must contain at least one column.")

        # NOTE:
        # Currently using only the first feature (s1) for anomaly detection.
        # This is a simplified v1 approach to keep behaviour interpretable
        # and avoid confusion during evaluation.
        #
        # Future improvement:
        # Apply QuantileAD across all features and combine results
        # (e.g., OR condition across multiple columns).
        
        # Select first column and convert to ADTK-compatible series
        series = validate_series(df.iloc[:, 0])

        # Detect anomalies using QuantileAD
        anomalies = self.model.fit_detect(series)

        # Convert output to boolean flags (True = anomaly)
        anomalies = anomalies.reindex(df.index)
        anomaly_flag = anomalies.fillna(False).astype(bool)

        # Measure runtime
        runtime = time.time() - start_time

        # Return results following shared detector contract
        return {
            "model_name": self.name,
            "timestamp": df.index,
            "anomaly_flag": anomaly_flag,
            "score": anomaly_flag,  # Binary score 
            "runtime": runtime
        }
