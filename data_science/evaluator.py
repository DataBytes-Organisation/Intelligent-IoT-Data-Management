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

    Parameters
    ----------
    detector_output : dict
        Standard detector output dictionary containing:
        - anomaly_flag : pd.Series (bool)
        - model_name : str
        - timestamp : pd.Index
        - score : pd.Series (optional continuous anomaly scores)
        - runtime : float (optional)

    labels : pd.Series
        Ground-truth anomaly labels aligned with dataset index.

        Expected format:
        - "normal" = normal sample
        - anything else = anomaly

    Returns
    -------
    dict
        Dictionary containing:
        - model
        - precision
        - recall
        - f1
        - auc_roc
        - n_predicted
        - n_actual
    """

    # Validate detector output
    if "anomaly_flag" not in detector_output:

        raise ValueError(
            "Detector output missing 'anomaly_flag'"
        )

    if "model_name" not in detector_output:

        raise ValueError(
            "Detector output missing 'model_name'"
        )

    # Predicted anomaly labels
    preds = detector_output["anomaly_flag"]

    # Convert predictions to aligned boolean Series
    if not isinstance(preds, pd.Series):

        preds = pd.Series(
            preds,
            index=labels.index
        )

    preds = (
        preds.reindex(labels.index)
        .fillna(False)
        .astype(bool)
    )

    # Convert labels to aligned Series
    if not isinstance(labels, pd.Series):

        labels = pd.Series(labels)

    labels = (
        labels.reindex(preds.index)
        .fillna("normal")
    )

    # Convert to boolean anomaly labels
    # False = normal
    # True = anomaly
    labels = labels != "normal"

    # Classification metrics
    precision = precision_score(
        labels,
        preds,
        zero_division=0
    )

    recall = recall_score(
        labels,
        preds,
        zero_division=0
    )

    f1 = f1_score(
        labels,
        preds,
        zero_division=0
    )

    # Default ROC-AUC value
    auc_roc = None

    # Continuous anomaly scores
    scores = detector_output.get("score")

    if scores is not None:

        try:

            # Convert scores to aligned numeric Series
            if not isinstance(scores, pd.Series):

                scores = pd.Series(
                    scores,
                    index=labels.index
                )

            scores = (
                scores.reindex(labels.index)
                .fillna(0)
                .astype(float)
            )

            # ROC-AUC calculation
            auc_roc = roc_auc_score(
                labels.astype(int),
                scores
            )

        except Exception as e:

            print(
                f"[evaluator] ROC-AUC "
                f"calculation failed: {e}"
            )

            auc_roc = None

    # Final evaluation dictionary
    return {

        "model": detector_output["model_name"],

        "precision": round(
            float(precision), 6
        ),

        "recall": round(
            float(recall), 6
        ),

        "f1": round(
            float(f1), 6
        ),

        "auc_roc": (
            round(float(auc_roc), 6)
            if auc_roc is not None else None
        ),

        "n_predicted": int(preds.sum()),

        "n_actual": int(labels.sum()),
    }