import time
import pandas as pd
from adtk.detector import QuantileAD
from adtk.data import validate_series


class QuantileADDetector:
    """
    Quantile-based anomaly detector using ADTK.

    Detects anomalies based on upper and lower quantile thresholds
    and computes a numeric anomaly score based on distance from these thresholds.
    """

    def __init__(self, high=0.95, low=0.05):
        self.high = high
        self.low = low
        self.model = QuantileAD(high=high, low=low)
        self.name = "QuantileADDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        start_time = time.time()

        if df is None or df.shape[1] == 0:
            raise ValueError("Input DataFrame must contain at least one column.")

        # Use numeric columns only
        df_numeric = df.select_dtypes(include=["number"])
        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for QuantileAD.")

        # Use first numeric column
        series = validate_series(df_numeric.iloc[:, 0])

        # Handle missing values
        series = series.ffill().bfill()

        # Detect anomalies
        anomalies = self.model.fit_detect(series)

        # Align properly to series index
        anomalies = anomalies.reindex(series.index)
        anomaly_flag = anomalies.fillna(False).astype(bool)

        # Compute quantile thresholds
        lower = series.quantile(self.low)
        upper = series.quantile(self.high)

        # Distance-based score
        scores = (
            (series - upper).clip(lower=0) +
            (lower - series).clip(lower=0)
        ).fillna(0)

        runtime = time.time() - start_time

        return {
            "model_name": self.name,
            "timestamp": series.index,
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime
        }
