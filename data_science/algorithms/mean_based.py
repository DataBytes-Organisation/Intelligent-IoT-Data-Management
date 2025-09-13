import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def mean_based(df, streams, start_date, end_date, threshold=None):
    """
    Detect outliers based on the mean value of each stream.

    Each stream is evaluated by its average value over the specified time period.
    If the average value of a stream is lower than the threshold (computed as mean - std of the average values),
    the stream is flagged as an outlier.

    Note: For consistency, the computed average is stored in the key 'avg_corr'.

    Parameters:
    - df: DataFrame containing data with 'created_at' as index.
    - streams: List of column names (streams) to analyze (at least 3 streams).
    - start_date: Start time (str or datetime).
    - end_date: End time (str or datetime).
    - threshold: Threshold to determine an outlier. If not provided, the value (mean - std) of the average values is used.

    Returns:
    - A dictionary with keys as stream names and values as a dict containing:
      - avg_corr: The average value of the stream.
      - is_outlier: True if the stream is detected as an outlier.
    """

    if len(streams) < 3:
        raise ValueError("At least 3 streams are required for analysis.")

    # Filter data for the specified time period and streams
    df_period = df.loc[start_date:end_date, streams]

    # Calculate the mean value for each stream
    avg_values = df_period.mean()

    # If threshold not provided, calculate it as (mean - std) of the average values
    if threshold is None:
        threshold = avg_values.mean() - avg_values.std()

    print("Mean value of each stream:")
    print(avg_values)
    print("\nOutlier threshold:", threshold)
    print("\nSuspected outlier streams (low mean):")
    print(avg_values[avg_values < threshold])

    results = {stream: {"avg_corr": avg_values[stream],
                        "is_outlier": avg_values[stream] < threshold}
               for stream in streams}
    return results