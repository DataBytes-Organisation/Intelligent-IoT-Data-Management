import time
import pandas as pd
from pyod.models.ecod import ECOD


class ECODDetector:
    """
    ECOD (Empirical Cumulative Distribution Outlier Detection)

    Detects anomalies using tail probability estimation.
    Suitable for high-dimensional data and does not require labelled training data.
    """

    def __init__(self, contamination=0.05):
        self.contamination = contamination
        self.model = ECOD(contamination=self.contamination)
        self.model_name = "ECODDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Run ECOD anomaly detection.

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

        # Use numeric columns only
        df_numeric = df.select_dtypes(include=["number"])
        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for ECOD")

        # Fit model (unsupervised; no labels required)
        self.model.fit(df_numeric)

        # Labels: 0 = normal, 1 = anomaly
        labels = self.model.labels_

        if len(labels) != len(df):
            raise ValueError("Mismatch between input data and ECOD output length")

        anomaly_flag = pd.Series(labels.astype(bool), index=df.index)
        scores = pd.Series(self.model.decision_scores_, index=df.index)

        runtime = time.time() - start_time

        return {
            "model_name": self.model_name,
            "timestamp": df.index,
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime,
        }
