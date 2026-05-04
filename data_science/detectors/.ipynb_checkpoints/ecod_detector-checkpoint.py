import time
import pandas as pd
from pyod.models.ecod import ECOD


class ECODDetector:
    """
    ECOD (Empirical Cumulative Distribution Outlier Detection)

    Detects anomalies based on tail probabilities of feature distributions.
    Works well for high-dimensional data and requires no training phase.
    """

    def __init__(self, contamination=0.05):
        self.contamination = contamination
        self.model = ECOD(contamination=self.contamination)

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Run ECOD anomaly detection.

        Returns a dict compatible with the pipeline/evaluator:
        {
            "anomaly_flag": pd.Series (bool),
            "score": pd.Series (float),
            "timestamp": pd.Index,
            "runtime": float,
            "model_name": str
        }
        """

        start_time = time.time()

        # Fit model
        self.model.fit(df)

        # Labels: 0 = normal, 1 = anomaly
        labels = self.model.labels_

        # Ensure boolean Series aligned with df index
        anomaly_flag = pd.Series(labels.astype(bool), index=df.index)

        # Scores: higher = more anomalous
        scores = pd.Series(self.model.decision_scores_, index=df.index)

        runtime = time.time() - start_time

        return {
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "timestamp": df.index,
            "runtime": runtime,
            "model_name": "ECODDetector",  
        }