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

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Flag anomalies in `df`. If not yet fitted, fits on `df` first
        (unsupervised mode - fit and predict on same data).

        Returns
        -------
        dict with keys:
            - anomaly_flag : Series of bool (True = anomaly), indexed like df
            - score        : Series of float (higher = more anomalous)
            - model_name   : str
            - timestamp    : Index from df
            - runtime      : float (seconds taken by predict + scoring)
        """
        if not self._fitted:
            self.fit(df)

        start = time.time()
        preds = self.model.predict(df.values)            # 1=normal, -1=anomaly
        raw_scores = self.model.decision_function(df.values)  # higher=normal
        runtime = time.time() - start

        return {
            "anomaly_flag": pd.Series(preds == -1, index=df.index),
            "score":        pd.Series(-raw_scores, index=df.index),  # flip so higher = more anomalous
            "model_name":   self.name,
            "timestamp":    df.index,
            "runtime":      runtime,
        }
    
    def get_name(self) -> str:
        return self.name