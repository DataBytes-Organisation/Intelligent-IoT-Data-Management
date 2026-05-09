"""
ThresholdAD — Point-level anomaly detector using fixed thresholds
on normalised (z-scored) sensor data.

This detector flags individual data points whose z-score exceeds a
configurable upper/lower threshold.  Thresholds are set *after*
normalisation so that a single pair of values (e.g. ±3) works
across sensors with different native scales.

Output matches the standard pipeline interface:
    {stream: {"avg_corr": float, "is_outlier": bool}}
where `avg_corr` is the fraction of anomalous points in the stream
and `is_outlier` is True when that fraction exceeds
`outlier_fraction_threshold`.
"""

import numpy as np
import pandas as pd


def threshold_ad(
    df,
    streams,
    start_date,
    end_date,
    threshold=None,
    upper=None,
    lower=None,
    outlier_fraction_threshold=0.05,
):
    """
    Detect anomalies using z-score thresholds on normalised data.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with DatetimeIndex and numeric sensor columns.
    streams : list[str]
        Column names to analyse (at least 1).
    start_date, end_date : str or datetime
        Time window to evaluate.
    threshold : float, optional
        Symmetric z-score threshold.  If provided, both *upper* and
        *lower* are set to ±threshold.  Overrides ``upper``/``lower``.
    upper : float, optional
        Upper z-score bound (default 3.0).  Points above this are
        flagged.
    lower : float, optional
        Lower z-score bound (default −3.0).  Points below this are
        flagged.
    outlier_fraction_threshold : float
        A stream is marked ``is_outlier=True`` when the fraction of
        its anomalous points exceeds this value (default 0.05 = 5 %).

    Returns
    -------
    dict
        {stream: {"avg_corr": float,   # fraction of anomalous points
                  "is_outlier": bool}}  # True if fraction > threshold
    """
    if len(streams) < 1:
        raise ValueError("At least 1 stream is required for ThresholdAD.")

    # Resolve threshold parameters
    if threshold is not None:
        upper_z = abs(threshold)
        lower_z = -abs(threshold)
    else:
        upper_z = upper if upper is not None else 3.0
        lower_z = lower if lower is not None else -3.0

    # Filter to the requested time window and streams
    df_period = df.loc[start_date:end_date, streams]

    # Z-score normalisation (per-stream)
    means = df_period.mean()
    stds = df_period.std()
    # Avoid division by zero for constant streams
    stds_safe = stds.replace(0, 1)
    z_scores = (df_period - means) / stds_safe

    # Identify anomalous points (per-point boolean mask)
    anomaly_mask = (z_scores > upper_z) | (z_scores < lower_z)

    # Compute the fraction of anomalous points per stream
    anomaly_fractions = anomaly_mask.sum() / len(df_period)

    # Determine outlier streams
    outlier_streams = anomaly_fractions[anomaly_fractions > outlier_fraction_threshold]

    # Print summary
    print("ThresholdAD — Z-score thresholds: lower=%.2f, upper=%.2f" % (lower_z, upper_z))
    print("Anomalous-point fraction per stream:")
    print(anomaly_fractions)
    print("\nOutlier fraction threshold:", outlier_fraction_threshold)
    print("Flagged streams (fraction > threshold):")
    print(outlier_streams)

    results = {
        stream: {
            "avg_corr": float(anomaly_fractions[stream]),
            "is_outlier": bool(anomaly_fractions[stream] > outlier_fraction_threshold),
        }
        for stream in streams
    }
    return results
