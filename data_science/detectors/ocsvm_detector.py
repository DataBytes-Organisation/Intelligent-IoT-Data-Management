"""
One-Class SVM anomaly detector.

Wraps sklearn's OneClassSVM into the team's standard detector interface.
Detects multivariate anomalies - combinations of sensor values that don't
match the patterns learned during fit().
"""

import time
import pandas as pd
from sklearn.svm import OneClassSVM


class OCSVMDetector:
    def __init__(self, nu=0.05, kernel="rbf", gamma="scale"):
        """
        Parameters
        ----------
        nu : float, default=0.05
            Expected fraction of anomalies in training data (0 < nu <= 1).
            Lower nu = tighter boundary = fewer flagged as anomalies.
            Match this to your synthetic injection rate when known.
        kernel : str, default="rbf"
            Shape of the boundary. "rbf" handles non-linear patterns;
            "linear" is faster but only fits linear boundaries.
        gamma : str or float, default="scale"
            Controls boundary tightness for rbf kernel.
            "scale" is sklearn's smart default - leave it unless tuning.
        """
        self.model = OneClassSVM(nu=nu, kernel=kernel, gamma=gamma)
        self.name = "OCSVM"
        self._fitted = False

    def fit(self, df_train: pd.DataFrame):
        """Learn the boundary of normal behaviour from clean training data."""
        self.model.fit(df_train.values)
        self._fitted = True
        return self

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Flag anomalies in `df`. If not yet fitted, fits on `df` first
        (unsupervised mode - fit and predict on same data).

        Returns
        -------
        DataFrame with columns:
            - timestamp : original index
            - is_anomaly : bool (True = anomaly)
            - score : float (higher = more anomalous)
            - model : str ("OCSVM")
            - runtime : float (seconds, only in first row)
        """
        if not self._fitted:
            self.fit(df)

        start = time.time()
        preds = self.model.predict(df.values)            # 1=normal, -1=anomaly
        raw_scores = self.model.decision_function(df.values)  # higher=normal
        runtime = time.time() - start

        result = pd.DataFrame({
            "timestamp": df.index,
            "is_anomaly": preds == -1,
            "score": -raw_scores,   # flip so higher = more anomalous
            "model": self.name,
        })
        result["runtime"] = None
        result.loc[0, "runtime"] = runtime
        return result

    def get_name(self) -> str:
        return self.name