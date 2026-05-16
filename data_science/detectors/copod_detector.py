import time
import pandas as pd
from pyod.models.copod import COPOD


class COPODDetector:
    """
    COPOD (Copula-Based Outlier Detection)

    Detects anomalies using empirical copula distributions.
    A parameter-free and unsupervised anomaly detection method
    suitable for high-dimensional data.
    """

    def __init__(self, contamination=0.05):
        """
        Parameters
        ----------
        contamination : float
            Expected proportion of anomalies in the dataset.
        """

        self.contamination = contamination
        self.model = COPOD(contamination=self.contamination)
        self.model_name = "COPODDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Run COPOD anomaly detection.

        Parameters
        ----------
        df : pd.DataFrame
            Preprocessed input dataframe.

        Returns
        -------
        dict
            Dictionary containing:
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
            raise ValueError("No numeric columns available for COPOD")

        # Fit model
        self.model.fit(df_numeric)

        # Labels: 0 = normal, 1 = anomaly
        labels = self.model.labels_

        if len(labels) != len(df):
            raise ValueError("Mismatch between input data and COPOD output length")

        anomaly_flag = pd.Series(
            labels.astype(bool),
            index=df.index
        )

        scores = pd.Series(
            self.model.decision_scores_,
            index=df.index
        )

        runtime = time.time() - start_time

        return {
            "model_name": self.model_name,
            "timestamp": df.index,
            "anomaly_flag": anomaly_flag,
            "score": scores,
            "runtime": runtime,
        }