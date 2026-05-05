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
        self.name = "QuantileADDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        start_time = time.time()

        # Input validation
        if df is None or df.shape[1] == 0:
            raise ValueError("Input DataFrame must contain at least one column.")

        # Select numeric columns only
        df_numeric = df.select_dtypes(include=["number"])
        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for QuantileAD.")

        # Use first numeric column
        series = df_numeric.iloc[:, 0]

        # Validate and clean series
        series = validate_series(series)
        series = series.ffill().bfill()

        # Detect anomalies
        anomalies = self.model.fit_detect(series)

        # Align anomalies with dataframe index
        anomalies = anomalies.reindex(df.index)
        anomaly_flag = anomalies.fillna(False).astype(bool)

        # Compute quantile thresholds
        lower = series.quantile(self.low)
        upper = series.quantile(self.high)

        # Numeric anomaly score
        # Higher = more anomalous
        scores = (
            (series - upper).clip(lower=0) +   
            (lower - series).clip(lower=0)     
        ).fillna(0)

        # Align scores with df index
        scores = scores.reindex(df.index).fillna(0)

        # Runtime
        runtime = time.time() - start_time

    
        # Return result (STRICT contract)
        return {
            "model_name": self.name,
            "timestamp": df.index,              
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime
        }