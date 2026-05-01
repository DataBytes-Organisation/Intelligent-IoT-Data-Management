"""
Isolation Forest anomaly detector.

Wraps sklearn's IsolationForest into the team's standard detector interface.
Detects multivariate anomalies by isolating observations through random
partitioning — points that are easier to isolate are more likely anomalous.
"""

import time
import pandas as pd
from sklearn.ensemble import IsolationForest


class IsolationForestDetector:
    def __init__(self, contamination=0.05, n_estimators=100, random_state=42):
        """
        Parameters
        ----------
        contamination : float, default=0.05
            Expected fraction of anomalies in the data (0 < contamination <= 0.5).
            Lower contamination = fewer flagged as anomalies.
            Match this to your synthetic injection rate when known.
        n_estimators : int, default=100
            Number of isolation trees in the ensemble.
            More trees = more stable results but slower training.
        random_state : int, default=42
            Seed for reproducibility.
        """
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state,
        )
        self.name = "IsolationForest"
        self._fitted = False

    def fit(self, df_train: pd.DataFrame):
        """Learn the structure of normal behaviour from clean training data."""
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
        preds = self.model.predict(df.values)                 # 1=normal, -1=anomaly
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


if __name__ == "__main__":
    import sys
    import os
    import numpy as np
    from sklearn.metrics import (
        confusion_matrix,
        classification_report,
        accuracy_score,
    )

    # Ensure parent directory is on the path so we can import project modules
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from preprocessor import load_and_prepare
    from anomaly_injector import inject_all

    # ---------- Load & inject ----------
    filepath = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "datasets", "complex.csv"
    )
    print(f"[IsolationForest] Loading data from: {filepath}")
    df, scaler = load_and_prepare(filepath)
    df, labels = inject_all(df)
    y_true = labels.astype(int)
    print(f"[IsolationForest] Data shape: {df.shape}  |  Injected anomalies: {y_true.sum()}")

    # ---------- Run detector ----------
    detector = IsolationForestDetector(contamination=0.05)
    output = detector.detect(df)
    y_pred = output["anomaly_flag"].reindex(labels.index, fill_value=False).astype(int)

    # ---------- Accuracy ----------
    acc = accuracy_score(y_true, y_pred)
    print(f"\n  Accuracy : {acc:.4f}  ({acc*100:.2f}%)")
    print(f"  Runtime  : {output['runtime']:.4f} s")
    print(f"  Flagged  : {y_pred.sum()} / {len(y_pred)}")
    print(f"  Actual   : {y_true.sum()}")

    # ---------- Confusion Matrix (console) ----------
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    print(f"\n{'='*55}")
    print(f"   Isolation Forest  —  Confusion Matrix")
    print(f"{'='*55}")
    print(f"                    Predicted")
    print(f"                 Normal  Anomaly")
    print(f"  Actual Normal  {tn:>6}   {fp:>6}")
    print(f"  Actual Anomaly {fn:>6}   {tp:>6}")
    print(f"{'='*55}")
    print(f"  TN={tn}  FP={fp}  FN={fn}  TP={tp}")

    # ---------- Classification Report (console) ----------
    print(f"\n{'='*55}")
    print(f"   Isolation Forest  —  Classification Report")
    print(f"{'='*55}")
    print(classification_report(y_true, y_pred, target_names=["Normal", "Anomaly"], zero_division=0))
