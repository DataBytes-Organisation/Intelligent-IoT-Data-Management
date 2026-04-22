import pandas as pd
import numpy as np
from itertools import combinations


def preprocess_timeseries(df, timestamp_col, selected_streams):
    """
    Prepare and clean time-series data before correlation analysis.

    Parameters:
        df (pd.DataFrame): Original dataset.
        timestamp_col (str): Name of the timestamp column.
        selected_streams (list[str]): List of sensor/stream columns to analyse.

    Returns:
        pd.DataFrame:
            Cleaned dataframe indexed by timestamp and containing only selected streams.
    """
    # Validate inputs
    if timestamp_col not in df.columns:
        raise ValueError(f"Timestamp column '{timestamp_col}' not found in dataframe.")

    missing_streams = [col for col in selected_streams if col not in df.columns]
    if missing_streams:
        raise ValueError(f"Selected stream columns not found in dataframe: {missing_streams}")

    # Select only required columns
    required_columns = [timestamp_col] + selected_streams
    cleaned_df = df[required_columns].copy()

    # Convert timestamp column to datetime
    cleaned_df[timestamp_col] = pd.to_datetime(cleaned_df[timestamp_col], errors="coerce")

    # Drop rows with invalid timestamps
    cleaned_df = cleaned_df.dropna(subset=[timestamp_col])

    # Sort by timestamp
    cleaned_df = cleaned_df.sort_values(by=timestamp_col)

    # Set timestamp as index
    cleaned_df = cleaned_df.set_index(timestamp_col)

    # Convert selected streams to numeric if needed
    for col in selected_streams:
        cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")

    # Handle missing values
    cleaned_df = cleaned_df.interpolate(method="time")
    cleaned_df = cleaned_df.ffill().bfill()

    return cleaned_df



def create_rolling_windows(df, window_size, step_size):
    """
    Split the cleaned dataframe into rolling/sliding windows.

    Parameters:
        df (pd.DataFrame): Preprocessed dataframe.
        window_size (int): Number of rows per window.
        step_size (int): Step size between consecutive windows.

    Returns:
        list[pd.DataFrame]:
            List of windowed dataframes.
    """

    if not isinstance(df, pd.DataFrame):
        raise ValueError("Input must be a pandas DataFrame.")

    if window_size <= 0:
        raise ValueError("window_size must be greater than 0.")

    if step_size <= 0:
        raise ValueError("step_size must be greater than 0.")

    if len(df) < window_size:
        return []

    windows = []

    # Create rolling windows
    for start_idx in range(0, len(df) - window_size + 1, step_size):
        end_idx = start_idx + window_size
        window_df = df.iloc[start_idx:end_idx].copy()
        windows.append(window_df)

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

    if not isinstance(windows, list):
        raise ValueError("windows must be a list of pandas DataFrames.")

    correlation_results = []

    for i, window_df in enumerate(windows):
        if not isinstance(window_df, pd.DataFrame):
            raise ValueError(f"Window at index {i} is not a pandas DataFrame.")

        if window_df.empty:
            continue

        corr_matrix = window_df.corr(method="pearson")

        correlation_results.append({
            "window_index": i,
            "start_time": window_df.index.min(),
            "end_time": window_df.index.max(),
            "correlation_matrix": corr_matrix
        })

    return correlation_results


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
    
    if not isinstance(correlation_results, list):
        raise ValueError("correlation_results must be a list.")

    change_results = []

    for i in range(1, len(correlation_results)):
        previous_result = correlation_results[i - 1]
        current_result = correlation_results[i]

        previous_corr = previous_result["correlation_matrix"]
        current_corr = current_result["correlation_matrix"]

        # Get all unique sensor pairs from the correlation matrix columns
        stream_pairs = combinations(previous_corr.columns, 2)

        for stream_1, stream_2 in stream_pairs:
            prev_value = previous_corr.loc[stream_1, stream_2]
            curr_value = current_corr.loc[stream_1, stream_2]

            # Skip if either value is missing
            if pd.isna(prev_value) or pd.isna(curr_value):
                continue

            delta_r = abs(curr_value - prev_value)

            change_results.append({
                "previous_window_index": previous_result["window_index"],
                "current_window_index": current_result["window_index"],
                "stream_pair": (stream_1, stream_2),
                "previous_correlation": prev_value,
                "current_correlation": curr_value,
                "delta_r": delta_r,
                "previous_window_start": previous_result["start_time"],
                "previous_window_end": previous_result["end_time"],
                "current_window_start": current_result["start_time"],
                "current_window_end": current_result["end_time"]
            })

    return change_results


def generate_alerts(change_results, delta_threshold=0.3):
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
    if not isinstance(change_results, list):
        raise ValueError("change_results must be a list.")

    alerts = []

    for change in change_results:
        delta_r = change["delta_r"]

        if delta_r >= delta_threshold:
            # Optional severity levels
            if delta_r >= 0.7:
                severity = "HIGH"
            elif delta_r >= 0.5:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            alerts.append({
                "alert": True,
                "severity": severity,
                "stream_pair": change["stream_pair"],
                "delta_r": delta_r,
                "previous_correlation": change["previous_correlation"],
                "current_correlation": change["current_correlation"],
                "previous_window_index": change["previous_window_index"],
                "current_window_index": change["current_window_index"],
                "previous_window_start": change["previous_window_start"],
                "previous_window_end": change["previous_window_end"],
                "current_window_start": change["current_window_start"],
                "current_window_end": change["current_window_end"]
            })

    return alerts


def detect_correlation_change_alert(
    df,
    timestamp_col,
    selected_streams,
    window_size,
    step_size,
    delta_threshold=0.3
):
    """
    Run the full correlation change alert pipeline.

    Parameters:
        df (pd.DataFrame): Raw input dataframe.
        timestamp_col (str): Name of the timestamp column.
        selected_streams (list[str]): List of sensor columns to analyse.
        window_size (int): Number of rows per rolling window.
        step_size (int): Number of rows to move for each new window.
        delta_threshold (float): Threshold for triggering correlation change alerts.

    Returns:
        dict:
            {
                "processed_data": pd.DataFrame,
                "windows": list[pd.DataFrame],
                "correlation_results": list[dict],
                "change_results": list[dict],
                "alerts": list[dict]
            }
    """

    # Step 1: preprocess raw time-series data
    processed_data = preprocess_timeseries(
        df=df,
        timestamp_col=timestamp_col,
        selected_streams=selected_streams
    )

    # Step 2: create rolling windows
    windows = create_rolling_windows(
        df=processed_data,
        window_size=window_size,
        step_size=step_size
    )

    # Step 3: compute Pearson correlations for each window
    correlation_results = compute_window_correlations(windows)

    # Step 4: compare correlation changes between consecutive windows
    change_results = compare_correlation_changes(correlation_results)

    # Step 5: generate alerts based on threshold
    alerts = generate_alerts(
        change_results=change_results,
        delta_threshold=delta_threshold
    )

    return {
        "processed_data": processed_data,
        "windows": windows,
        "correlation_results": correlation_results,
        "change_results": change_results,
        "alerts": alerts
    }