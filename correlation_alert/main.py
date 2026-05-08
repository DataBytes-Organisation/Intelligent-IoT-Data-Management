import pandas as pd
import numpy as np
from itertools import combinations

from correlation_alert.preprocessing import (
    fix_timestamps,
    convert_sensor_columns_to_numeric,
    handle_missing_values,
    remove_outliers,
    validate_output
)

from typing import List, Dict, Any, Optional

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


def compute_window_correlations(
    windows: List[pd.DataFrame],
    method: str = "pearson",
    min_periods: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Computes Pearson (or other) correlation matrix for each pre-created window.
    
    This is a general-purpose function that works with ANY dataset.
    
    Parameters:
    -----------
    windows : List[pd.DataFrame]
        List of DataFrames (each is one sliding window)
    method : str
        Correlation method: 'pearson', 'kendall', 'spearman'
    min_periods : int
        Minimum number of observations required per pair
    
    Returns:
    --------
    List[Dict] where each dict contains:
        - window_index
        - start_time
        - end_time
        - window_size
        - correlation_matrix (pandas DataFrame)
    """
    
    results = []
    
    for idx, window_df in enumerate(windows):
        if len(window_df) < 2:
            continue
            
        # Compute correlation
        corr_matrix = window_df.corr(
            method=method, 
            min_periods=min_periods
        )
        
        result = {
            "window_index": idx,
            "start_time": window_df.index[0] if hasattr(window_df.index, '__len__') and len(window_df.index) > 0 else None,
            "end_time": window_df.index[-1] if hasattr(window_df.index, '__len__') and len(window_df.index) > 0 else None,
            "window_size": len(window_df),
            "correlation_matrix": corr_matrix
        }
        
        results.append(result)
    
    return results

def compare_correlation_changes(correlation_results):
    """
    Compare correlation matrices between consecutive windows.
    """

    if not isinstance(correlation_results, list):
        raise ValueError("correlation_results must be a list.")

    change_results = []

    for i in range(1, len(correlation_results)):
        previous_result = correlation_results[i - 1]
        current_result = correlation_results[i]

        previous_corr = previous_result["correlation_matrix"]
        current_corr = current_result["correlation_matrix"]

        stream_pairs = combinations(previous_corr.columns, 2)

        for stream_1, stream_2 in stream_pairs:
            prev_value = previous_corr.loc[stream_1, stream_2]
            curr_value = current_corr.loc[stream_1, stream_2]

            if pd.isna(prev_value) or pd.isna(curr_value):
                continue

            delta = round(abs(curr_value - prev_value), 4)
            prev_value = round(prev_value, 4)
            curr_value = round(curr_value, 4)

            change_results.append({
                "window_index": current_result["window_index"],
                "start_time": current_result["start_time"],
                "end_time": current_result["end_time"],
                "stream_1": stream_1,
                "stream_2": stream_2,
                "previous_corr": prev_value,
                "current_corr": curr_value,
                "delta": delta
            })

    return change_results

def get_alert_level(delta_r):
    """
    Classify correlation change magnitude into alert severity.
    """

    if delta_r is None:
        return None

    try:
        delta_r = float(delta_r)
    except (TypeError, ValueError):
        return None

    if delta_r < 0.3:
        return None
    elif delta_r < 0.5:
        return "LOW"
    elif delta_r < 0.7:
        return "MEDIUM"
    else:
        return "HIGH"

def generate_alerts(changes, strong_corr_threshold=0.7, weak_corr_threshold=0.4, delta_threshold=0.3):
    """
    Generate alerts based on correlation changes between windows.
    """

    alerts = []

    for change in changes:
        delta = change["delta"]
        prev_corr = change["previous_corr"]
        current_corr = change["current_corr"]

        alert_level = None
        reason = None

        if prev_corr >= strong_corr_threshold and current_corr <= weak_corr_threshold:
            alert_level = "MEDIUM"
            reason = f"Strong-to-weak drop: correlation went from {prev_corr:.2f} to {current_corr:.2f}"
            alerts.append(create_alert(change, alert_level, reason))
            continue

        if prev_corr <= weak_corr_threshold and current_corr >= strong_corr_threshold:
            alert_level = "MEDIUM"
            reason = f"Weak-to-strong rise: correlation went from {prev_corr:.2f} to {current_corr:.2f}"
            alerts.append(create_alert(change, alert_level, reason))
            continue

        if delta < delta_threshold:
            continue
        elif delta < 0.5:
            alert_level = "LOW"
            reason = f"Correlation changed by {delta:.2f}, classified as LOW severity"
            alerts.append(create_alert(change, alert_level, reason))
            continue
        elif delta < 0.7:
            alert_level = "MEDIUM"
            reason = f"Correlation changed by {delta:.2f}, classified as MEDIUM severity"
            alerts.append(create_alert(change, alert_level, reason))
            continue
        else:
            alert_level = "HIGH"
            reason = f"Correlation changed by {delta:.2f}, classified as HIGH severity"
            alerts.append(create_alert(change, alert_level, reason))
            continue

    return alerts


def create_alert(change, alert_level, reason):
    """
    Create a structured alert dictionary.
    """

    return {
        "window_index": change["window_index"],
        "start_time": change["start_time"],
        "end_time": change["end_time"],
        "stream_1": change["stream_1"],
        "stream_2": change["stream_2"],
        "previous_corr": change["previous_corr"],
        "current_corr": change["current_corr"],
        "delta": change["delta"],
        "alert_level": alert_level,
        "reason": reason
    }

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