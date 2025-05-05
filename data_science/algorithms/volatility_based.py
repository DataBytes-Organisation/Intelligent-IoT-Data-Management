import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def volatility_based(df, streams, start_date, end_date, threshold=None):
    """
    Detect outliers based on the volatility (standard deviation) of each stream.

    The volatility of each stream is calculated over the specified period.
    We use the negative of the standard deviation as the metric (since higher volatility results in a lower negative value).
    If this metric is lower than the threshold (computed as mean - std of the metric), the stream is flagged as an outlier.

    Note: The computed metric is stored in the key 'avg_corr' to maintain a consistent output format.

    Parameters:
    - df: DataFrame containing data with 'created_at' as index.
    - streams: List of column names (streams) to analyze (at least 3 streams).
    - start_date: Start time (str or datetime).
    - end_date: End time (str or datetime).
    - threshold: Threshold to determine an outlier. If not provided, the value (mean - std) of the metric is used.

    Returns:
    - A dictionary with keys as stream names and values as a dict containing:
      - avg_corr: The negative standard deviation of the stream.
      - is_outlier: True if the stream is detected as an outlier.
    """

    if len(streams) < 3:
        raise ValueError("At least 3 streams are required for analysis.")

    # Filter data for the specified time period and streams
    df_period = df.loc[start_date:end_date, streams]

    # Calculate the standard deviation (volatility) for each stream
    volatility = df_period.std()
    # Invert the standard deviation to follow the same criteria: lower value indicates anomaly
    volatility_metric = -volatility

    # If threshold not provided, calculate it as (mean - std) of the volatility metric
    if threshold is None:
        threshold = volatility_metric.mean() - volatility_metric.std()

    print("Volatility (std) of each stream (inverted):")
    print(volatility_metric)
    print("\nOutlier threshold:", threshold)
    print("\nSuspected outlier streams (abnormal volatility):")
    print(volatility_metric[volatility_metric < threshold])

    results = {stream: {"avg_corr": volatility_metric[stream],
                        "is_outlier": volatility_metric[stream] < threshold}
               for stream in streams}
    return results