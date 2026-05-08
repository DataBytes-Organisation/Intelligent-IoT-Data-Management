"""
Evaluator - v2
Computes Precision, Recall, F1, and ROC-AUC
for anomaly detectors against ground-truth labels.
"""

import pandas as pd

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)


def evaluate(detector_output: dict, labels: pd.Series) -> dict:
    """
    Evaluate detector predictions against ground-truth labels.

    labels can be either:
    - boolean labels: True = anomaly, False = normal
    - string labels: "normal" = normal, anything else = anomaly
    """

    if "anomaly_flag" not in detector_output:
        raise ValueError("Detector output missing 'anomaly_flag'")

    if "model_name" not in detector_output:
        raise ValueError("Detector output missing 'model_name'")

    labels = pd.Series(labels)

    if labels.dtype == bool:
        labels_bool = labels.copy()
    else:
        labels_bool = labels != "normal"

    preds = detector_output["anomaly_flag"]

    if not isinstance(preds, pd.Series):
        preds = pd.Series(preds, index=labels_bool.index)

    preds = (
        preds.reindex(labels_bool.index)
        .fillna(False)
        .astype(bool)
    )

    labels_bool = (
        labels_bool.reindex(preds.index)
        .fillna(False)
        .astype(bool)
    )

    precision = precision_score(labels_bool, preds, zero_division=0)
    recall = recall_score(labels_bool, preds, zero_division=0)
    f1 = f1_score(labels_bool, preds, zero_division=0)

    tp = int(((preds) & (labels_bool)).sum())
    fp = int(((preds) & (~labels_bool)).sum())
    tn = int(((~preds) & (~labels_bool)).sum())
    fn = int(((~preds) & (labels_bool)).sum())
    fpr = (fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = (fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    auc_roc = None

    scores = detector_output.get("score")

    if scores is not None:
        try:
            if not isinstance(scores, pd.Series):
                scores = pd.Series(scores, index=labels_bool.index)

            scores = (
                scores.reindex(labels_bool.index)
                .fillna(0)
                .astype(float)
            )

            if labels_bool.nunique() == 2:
                auc_roc = roc_auc_score(labels_bool.astype(int), scores)

        except Exception as e:
            print(f"[evaluator] ROC-AUC calculation failed: {e}")
            auc_roc = None

    return {
        "model": detector_output["model_name"],
        "precision": round(float(precision), 6),
        "recall": round(float(recall), 6),
        "f1": round(float(f1), 6),
        "auc_roc": round(float(auc_roc), 6) if auc_roc is not None else None,
        "n_predicted": int(preds.sum()),
        "n_actual": int(labels_bool.sum()),
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "false_positive_rate": round(float(fpr), 6),
        "false_negative_rate": round(float(fnr), 6),
    }