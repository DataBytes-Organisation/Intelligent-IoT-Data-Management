import time
import pandas as pd
from pyod.models.lof import LOF


class LOFDetector:
    """
    LOF (Local Outlier Factor)

    Detects anomalies by comparing the local density of each point
    to the local densities of its neighbours. Points with significantly
    lower density than their neighbours are flagged as anomalies.
    """

    def __init__(self, contamination=0.05, n_neighbors=20):
        self.contamination = contamination
        self.n_neighbors = n_neighbors
        self.model_name = "LOFDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Run LOF anomaly detection.

        Parameters:
            df (pd.DataFrame): Preprocessed input data

        Returns:
            dict with:
                anomaly_flag (pd.Series[bool])
                score (pd.Series[float])
                timestamp (pd.Index)
                runtime (float)
                model_name (str)
        """
        if df is None or len(df) == 0:
            raise ValueError("Input dataframe is empty")

        start_time = time.time()

        df_numeric = df.select_dtypes(include=["number"])
        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for LOF")

        if len(df_numeric) < 2:
            raise ValueError("LOF requires at least 2 samples")

        # n_neighbors must be < n_samples; clamp for small datasets
        n_neighbors = min(self.n_neighbors, len(df_numeric) - 1)
        model = LOF(contamination=self.contamination, n_neighbors=n_neighbors)
        model.fit(df_numeric)

        labels = model.labels_
        if len(labels) != len(df):
            raise ValueError("Mismatch between input data and LOF output length")

        anomaly_flag = pd.Series(labels.astype(bool), index=df.index)
        scores = pd.Series(model.decision_scores_, index=df.index)

        runtime = time.time() - start_time

        return {
            "model_name": self.model_name,
            "timestamp": df.index,
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime,
        }
