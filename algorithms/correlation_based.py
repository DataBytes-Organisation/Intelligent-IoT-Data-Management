import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


def detect_outlier_streams(df, streams, start_date, end_date, threshold=None):
    """
    Analyze streams to detect outliers based on the correlation between the streams.

    Parameters:
    - df: DataFrame containing data with 'created_at' column already set as the index.
    - streams: List of column names (streams) to analyze (at least 3 streams).
    - start_date: Start time (str or datetime).
    - end_date: End time (str or datetime).
    - threshold: Threshold to determine an outlier. If not provided, the value (mean - std) of the average correlations is used.

    Returns:
    - A dictionary with keys as stream names and values as a dict containing average correlation (avg_corr)
      and flag 'is_outlier' (True/False).
    """

    # Check the number of streams
    if len(streams) < 3:
        raise ValueError("At least 3 streams are required to analyze outliers.")

    # Filter the data for the given time period
    df_period = df.loc[start_date:end_date, streams]

    # Calculate the correlation matrix between the streams
    corr_matrix = df_period.corr()

    # Compute the average correlation for each stream with the other streams
    avg_corr = {}
    for stream in streams:
        # Exclude self-correlation (always 1)
        other_corr = corr_matrix.loc[stream, streams].drop(stream)
        avg_corr[stream] = other_corr.mean()

    avg_corr_series = pd.Series(avg_corr)

    # If no threshold is provided, use mean - std of the average correlations
    if threshold is None:
        threshold = avg_corr_series.mean() - avg_corr_series.std()

    # Identify streams with average correlation lower than the threshold (suspected anomaly)
    outlier_streams = avg_corr_series[avg_corr_series < threshold]

    # Print the analysis results
    print("Average correlation of each stream:")
    print(avg_corr_series)
    print("\nOutlier threshold:", threshold)
    print("\nSuspected outlier streams:")
    print(outlier_streams)

    # Plot the heatmap of the correlation matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt=".2f", square=True, linewidths=0.5)
    plt.title("Correlation Heatmap between Streams")
    plt.tight_layout()
    plt.show()

    # Return the results as a dictionary
    results = {stream: {"avg_corr": avg_corr_series[stream], "is_outlier": avg_corr_series[stream] < threshold}
               for stream in streams}
    return results