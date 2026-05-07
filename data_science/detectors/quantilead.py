import time
import pandas as pd
from adtk.detector import QuantileAD
from adtk.data import validate_series


class QuantileADDetector:
    """
    Quantile-based anomaly detector using ADTK.

    Detects anomalies using quantile thresholds and produces
    a numeric score representing distance outside the thresholds.
    """

    def __init__(self, high=0.95, low=0.05):
        self.high = high
        self.low = low
        self.model = QuantileAD(high=high, low=low)

        # Keep both for compatibility with pipeline naming
        self.model_name = "QuantileADDetector"
        self.name = "QuantileADDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        start_time = time.time()

        # Input validation
        if df is None or df.shape[1] == 0:
            raise ValueError("Input DataFrame must contain at least one column.")

        df_numeric = df.select_dtypes(include=["number"])
        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for QuantileAD.")

        # Prepare series
        series = validate_series(df_numeric.iloc[:, 0])
        series = series.ffill().bfill()

        # Detect anomalies
        anomalies = self.model.fit_detect(series)

        # Align to df index
        anomalies = anomalies.reindex(df.index)
        anomaly_flag = anomalies.fillna(False).astype(bool)

        # Compute thresholds
        lower = series.quantile(self.low)
        upper = series.quantile(self.high)

        # Numeric anomaly score
        scores = (
            (series - upper).clip(lower=0) +
            (lower - series).clip(lower=0)
        ).fillna(0)

        scores = scores.reindex(df.index).fillna(0)

        # Runtime
        runtime = time.time() - start_time

        # Output 
        return {
            "model_name": self.model_name,
            "timestamp": df.index,
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime
        }