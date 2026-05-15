"""
ROC Curve Plotter

Generates ROC curve visualisations for anomaly detectors
that provide continuous anomaly scores.
"""

from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    roc_curve,
    roc_auc_score
)


def plot_roc_curves(
    results: dict,
    labels: pd.Series,
    output_dir="outputs"
):
    """
    Plot ROC curves for multiple anomaly detectors.

    Parameters
    ----------
    results : dict
        Dictionary of detector outputs.

    labels : pd.Series
        Ground-truth labels.

    output_dir : str
        Directory where ROC plot will be saved.
    """

    # Create output directory
    output_path = Path(output_dir)

    output_path.mkdir(
        parents=True,
        exist_ok=True
    )

    # Convert labels to boolean anomaly labels
    # False = normal
    # True = anomaly
    labels_bool = labels != "normal"

    plt.figure(figsize=(10, 7))

    plotted = False

    # Process each detector
    for name, output in results.items():

        scores = output.get("score")

        # Skip detectors without scores
        if scores is None:

            print(
                f"[roc] Skipping {name} "
                f"(no scores)"
            )

            continue

        try:

            # Convert scores to Series
            if not isinstance(scores, pd.Series):

                scores = pd.Series(
                    scores,
                    index=labels.index
                )

            # Align scores
            scores = (
                scores.reindex(labels.index)
                .fillna(0)
                .astype(float)
            )

            # Compute ROC values
            fpr, tpr, _ = roc_curve(
                labels_bool.astype(int),
                scores
            )

            # Compute AUC
            auc = roc_auc_score(
                labels_bool.astype(int),
                scores
            )

            # Plot ROC curve
            plt.plot(
                fpr,
                tpr,
                linewidth=2,
                label=f"{name} (AUC={auc:.3f})"
            )

            plotted = True

        except Exception as e:

            print(
                f"[roc] Failed for "
                f"{name}: {e}"
            )

    # Baseline diagonal
    plt.plot(
        [0, 1],
        [0, 1],
        linestyle="--"
    )

    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")

    plt.title(
        "ROC Curves for Anomaly Detectors"
    )

    plt.legend(loc="lower right")

    plt.grid(True)

    # Save figure
    save_path = output_path / "roc_curves.png"

    if plotted:

        plt.savefig(
            save_path,
            bbox_inches="tight"
        )

        print(
            f"[roc] Saved ROC plot to: "
            f"{save_path}"
        )

    else:

        print(
            "[roc] No valid ROC curves "
            "generated"
        )

    plt.close()