"""
Evaluator - v1
Computes precision, Recall, F1 for any detector agains ground truth labels
"""


import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score


def evaluate(detector_output: pd.DataFrame, labels: pd.Series) -> dict:
    """
    Score a detector against ground-truth labels.

    Parameters
    ----------
    detector_output : DataFrame
        Standard detector output, must have columns 'timestamp',
        'is_anomaly', and 'model'.
    labels : Series
        Ground-truth boolean Series, indexed the same way as the data.

    Returns
    -------
    dict with keys: model, precision, recall, f1, n_predicted, n_actual.
    """

    # align predicitons to label index by timestamp
    preds = detector_output.set_index("timestamp")["is_anomaly"]
    preds = preds.reindex(labels.index, fill_value=False)

    return {
    "model":       detector_output["model"].iloc[0],
    "precision":   precision_score(labels, preds, zero_division=0),
    "recall":      recall_score(labels, preds, zero_division=0),
    "f1":          f1_score(labels, preds, zero_division=0),
    "n_predicted": int(preds.sum()),
    "n_actual":    int(labels.sum()),
}
