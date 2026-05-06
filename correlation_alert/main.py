import pandas as pd
import numpy as np
from itertools import combinations

import pandas as pd
import numpy as np

from correlation_alert.preprocessing import (
    fix_timestamps,
    convert_sensor_columns_to_numeric,
    handle_missing_values,
    remove_outliers,
    validate_output
)

from typing import List

def preprocess_timeseries(df, timestamp_col, selected_streams):
    """
    Preprocess selected time-series sensor streams before correlation analysis.

    This function is designed to plug into the main wrapper pipeline as:

        preprocess_timeseries(df, timestamp_col, selected_streams)

    It only handles preprocessing and does not perform rolling windows,
    correlation calculation, comparison, or alert generation.
    """

    # Select only required columns
    required_cols = [timestamp_col] + selected_streams
    processed_df = df[required_cols].copy()

    # Clean and sort timestamp column
    processed_df = fix_timestamps(processed_df, time_col=timestamp_col)

    # Convert sensor columns to numeric values
    processed_df = convert_sensor_columns_to_numeric(
        processed_df,
        time_col=timestamp_col
    )

    # Handle missing values
    processed_df = handle_missing_values(
        processed_df,
        method="interpolate"
    )

    # Remove outliers from selected sensor streams
    processed_df = remove_outliers(
        processed_df,
        sensor_cols=selected_streams,
        iqr_factor=3.0
    )

    # Validate cleaned output
    processed_df = validate_output(
        processed_df,
        time_col=timestamp_col
    )

    # Set timestamp as index for downstream rolling-window analysis
    processed_df = processed_df.set_index(timestamp_col)

    return processed_df


def create_rolling_windows(
    df: pd.DataFrame,
    window_size: int,
    step_size: int
) -> List[pd.DataFrame]:
    """
    Creates rolling windows from a preprocessed time-series DataFrame.

    Parameters:
        df (pd.DataFrame): Preprocessed DataFrame indexed by timestamp.
        window_size (int): Number of rows/timestamps in each window.
        step_size (int): Step size between windows.

    Returns:
        List[pd.DataFrame]: List of windowed DataFrames.
    """

    windows = []
    n = len(df)

    for start in range(0, n - window_size + 1, step_size):
        end = start + window_size
        window = df.iloc[start:end].copy()
        windows.append(window)

    return windows


def compute_window_correlations(windows, method="pearson"):
    """
    Compute correlation matrix for each rolling window.

    Parameters:
        windows (list[pd.DataFrame]): List of rolling windows.
        method (str): Correlation method to use (default: 'pearson').

    Returns:
        list[dict]:
            Each item should contain:
            {
                "window_index": int,
                "start_time": timestamp,
                "end_time": timestamp,
                "correlation_matrix": pd.DataFrame
            }
    """

    # TODO:
    # 1. Iterate through each window
    # 2. Compute correlation matrix for that window
    # 3. Store metadata such as window index, start time, end time
    # 4. Return list of correlation results

    pass


def compare_correlation_changes(correlation_results):
    """
    Compare correlation matrices between consecutive windows.

    Parameters:
        correlation_results (list[dict]): Output from compute_window_correlations().

    Returns:
        list[dict]:
            Each item should contain:
            {
                "window_index": int,
                "start_time": timestamp,
                "end_time": timestamp,
                "stream_1": str,
                "stream_2": str,
                "previous_corr": float,
                "current_corr": float,
                "delta": float
            }
    """

    # TODO:
    # 1. Compare each window with the previous one
    # 2. Extract pairwise correlation values
    # 3. Compute delta = abs(current_corr - previous_corr)
    # 4. Return structured list of changes

    pass


def generate_alerts(changes, strong_corr_threshold=0.7, weak_corr_threshold=0.4, delta_threshold=0.3):
    """
    Generate alerts based on correlation changes.

    Parameters:
        changes (list[dict]): Output from compare_correlation_changes().
        strong_corr_threshold (float): Threshold to define strong correlation.
        weak_corr_threshold (float): Threshold to define weak correlation.
        delta_threshold (float): Threshold for significant change.

    Returns:
        list[dict]:
            Each alert item may contain:
            {
                "window_index": int,
                "start_time": timestamp,
                "end_time": timestamp,
                "stream_1": str,
                "stream_2": str,
                "previous_corr": float,
                "current_corr": float,
                "delta": float,
                "alert_level": str,
                "reason": str
            }
    """

    # TODO:
    # 1. Check whether correlation change exceeds threshold
    # 2. Check whether strong-to-weak drop occurred
    # 3. Optionally check sign changes
    # 4. Assign alert level and reason
    # 5. Return alert list

    pass


def detect_correlation_change_alert(
    df,
    timestamp_col,
    selected_streams,
    window_size=30,
    step_size=5,
    method="pearson",
    strong_corr_threshold=0.7,
    weak_corr_threshold=0.4,
    delta_threshold=0.3
):
    """
    Main wrapper function for the correlation change alert pipeline.

    Parameters:
        df (pd.DataFrame): Original dataset.
        timestamp_col (str): Name of the timestamp column.
        selected_streams (list[str]): Streams selected for analysis.
        window_size (int): Number of rows per rolling window.
        step_size (int): Step size between windows.
        method (str): Correlation method.
        strong_corr_threshold (float): Strong correlation threshold.
        weak_corr_threshold (float): Weak correlation threshold.
        delta_threshold (float): Significant change threshold.

    Returns:
        dict:
            {
                "processed_data": pd.DataFrame,
                "windows": list[pd.DataFrame],
                "correlation_results": list[dict],
                "changes": list[dict],
                "alerts": list[dict]
            }
    """

    processed_data = preprocess_timeseries(df, timestamp_col, selected_streams)

    windows = create_rolling_windows(processed_data, window_size, step_size)

    correlation_results = compute_window_correlations(windows, method=method)

    changes = compare_correlation_changes(correlation_results)

    alerts = generate_alerts(
        changes,
        strong_corr_threshold=strong_corr_threshold,
        weak_corr_threshold=weak_corr_threshold,
        delta_threshold=delta_threshold
    )

    return {
        "processed_data": processed_data,
        "windows": windows,
        "correlation_results": correlation_results,
        "changes": changes,
        "alerts": alerts
    }