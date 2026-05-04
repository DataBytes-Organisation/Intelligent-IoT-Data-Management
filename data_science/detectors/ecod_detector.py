import time
import pandas as pd
from pyod.models.ecod import ECOD


class ECODDetector:
    """
    ECOD (Empirical Cumulative Distribution Outlier Detection)

    Detects anomalies using tail probability estimation.
    Suitable for high-dimensional data and requires no training phase.
    """

    def __init__(self, contamination=0.05):
        self.contamination = contamination
        self.model = ECOD(contamination=self.contamination)

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Run ECOD anomaly detection.

        Parameters:
            df (pd.DataFrame): Preprocessed input data

        Returns:
            dict:
            {
                "anomaly_flag": pd.Series (bool),
                "score": pd.Series (float),
                "timestamp": pd.Index,
                "runtime": float,
                "model_name": str
            }
        """

        if df is None or len(df) == 0:
            raise ValueError("Input dataframe is empty")

        start_time = time.time()

        # Ensure numeric-only input (ECOD requirement)
        df_numeric = df.select_dtypes(include=["number"])

        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for ECOD")

        # Fit ECOD model
        self.model.fit(df_numeric)

        # Labels: 0 = normal, 1 = anomaly
        labels = self.model.labels_

        if len(labels) != len(df_numeric):
            raise ValueError("Mismatch between input data and ECOD output length")

        # Convert to boolean Series aligned with original index
        anomaly_flag = pd.Series(labels.astype(bool), index=df_numeric.index)

        # Anomaly scores (higher = more anomalous)
        scores = pd.Series(self.model.decision_scores_, index=df_numeric.index)

        runtime = time.time() - start_time

        return {
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "timestamp": df_numeric.index,
            "runtime": runtime,
            "model_name": "ECODDetector",
        }
