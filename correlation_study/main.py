import pandas as pd
import numpy as np
import itertools

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

    # Select required columns
    columns_to_select = [timestamp_col] + selected_streams
    df_selected = df[columns_to_select].copy()

    # Convert timestamp column to datetime
    df_selected[timestamp_col] = pd.to_datetime(df_selected[timestamp_col], errors='coerce')

    # Sort by timestamp
    df_selected = df_selected.sort_values(timestamp_col)

    # Set timestamp as index
    df_selected = df_selected.set_index(timestamp_col)

    # Handle missing values - interpolate numeric columns
    numeric_cols = df_selected.select_dtypes(include=[np.number]).columns
    df_selected[numeric_cols] = df_selected[numeric_cols].interpolate(method='linear', limit_direction='both')

    # Drop any remaining rows with all NaN
    df_selected = df_selected.dropna(how='all')

    return df_selected


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

    windows = []
    for start in range(0, len(df) - window_size + 1, step_size):
        end = start + window_size
        window_df = df.iloc[start:end]
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

    correlation_results = []
    for idx, window in enumerate(windows):
        # Compute correlation matrix
        corr_matrix = window.corr(method=method)

        # Get start and end times
        start_time = window.index[0]
        end_time = window.index[-1]

        result = {
            "window_index": idx,
            "start_time": start_time,
            "end_time": end_time,
            "correlation_matrix": corr_matrix
        }
        correlation_results.append(result)

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

    changes = []
    if len(correlation_results) < 2:
        return changes

    for i in range(1, len(correlation_results)):
        prev_result = correlation_results[i-1]
        curr_result = correlation_results[i]

        prev_matrix = prev_result["correlation_matrix"]
        curr_matrix = curr_result["correlation_matrix"]

        # Get common columns (sensors)
        common_streams = list(set(prev_matrix.columns) & set(curr_matrix.columns))

        # Compare each pair
        for stream1, stream2 in itertools.combinations(common_streams, 2):
            prev_corr = prev_matrix.loc[stream1, stream2]
            curr_corr = curr_matrix.loc[stream1, stream2]
            delta = abs(curr_corr - prev_corr)

            change = {
                "window_index": curr_result["window_index"],
                "start_time": curr_result["start_time"],
                "end_time": curr_result["end_time"],
                "stream_1": stream1,
                "stream_2": stream2,
                "previous_corr": prev_corr,
                "current_corr": curr_corr,
                "delta": delta
            }
            changes.append(change)

    return changes


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

    alerts = []
    for change in changes:
        if change["delta"] >= delta_threshold:
            prev_corr = change["previous_corr"]
            curr_corr = change["current_corr"]

            # Check for strong-to-weak drop
            if prev_corr >= strong_corr_threshold and curr_corr <= weak_corr_threshold:
                alert_level = "HIGH"
                reason = "Strong correlation dropped to weak"
            # Check for sign change
            elif (prev_corr > 0 and curr_corr < 0) or (prev_corr < 0 and curr_corr > 0):
                alert_level = "MEDIUM"
                reason = "Correlation sign changed"
            else:
                alert_level = "LOW"
                reason = "Significant correlation change"

            alert = change.copy()
            alert["alert_level"] = alert_level
            alert["reason"] = reason
            alerts.append(alert)

    return alerts


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


if __name__ == "__main__":
    # Example usage with sample data
    # Create sample data
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=100, freq='H')
    data = {
        'timestamp': dates,
        'sensor1': np.random.randn(100).cumsum(),
        'sensor2': np.random.randn(100).cumsum(),
        'sensor3': np.random.randn(100).cumsum()
    }
    df = pd.DataFrame(data)
    
    # Run the pipeline
    result = detect_correlation_change_alert(
        df=df,
        timestamp_col='timestamp',
        selected_streams=['sensor1', 'sensor2', 'sensor3'],
        window_size=20,
        step_size=5
    )
    
    # Print summary
    print(f"Number of windows: {len(result['windows'])}")
    print(f"Number of correlation results: {len(result['correlation_results'])}")
    print(f"Number of changes: {len(result['changes'])}")
    print(f"Number of alerts: {len(result['alerts'])}")
    
    # Example: Print first correlation matrix
    if result['correlation_results']:
        print("\nFirst window correlation matrix:")
        print(result['correlation_results'][0]['correlation_matrix'])
        
    #simple.csv
    import pandas as pd
import numpy as np
import itertools
from typing import List, Dict, Any

def preprocess_timeseries(
    df: pd.DataFrame, 
    timestamp_col: str = "time", 
    selected_streams: List[str] = None
) -> pd.DataFrame:
    """
    Preprocess time-series data for correlation analysis.
    """
    if selected_streams is None:
        selected_streams = [col for col in df.columns if col != timestamp_col]
    
    # Select columns
    columns_to_select = [timestamp_col] + selected_streams
    df_selected = df[columns_to_select].copy()

    # Convert timestamp (your 'time' column is numeric, so we treat it as seconds or index)
    if pd.api.types.is_numeric_dtype(df_selected[timestamp_col]):
        df_selected[timestamp_col] = pd.to_datetime(df_selected[timestamp_col], unit='s', errors='coerce')
    else:
        df_selected[timestamp_col] = pd.to_datetime(df_selected[timestamp_col], errors='coerce')

    # Sort by time
    df_selected = df_selected.sort_values(timestamp_col)

    # Set timestamp as index
    df_selected = df_selected.set_index(timestamp_col)

    # Interpolate missing values (if any)
    numeric_cols = df_selected.select_dtypes(include=[np.number]).columns
    if not numeric_cols.empty:
        df_selected[numeric_cols] = df_selected[numeric_cols].interpolate(
            method='linear', limit_direction='both'
        )

    # Drop completely empty rows
    df_selected = df_selected.dropna(how='all')

    return df_selected


def create_rolling_windows(
    df: pd.DataFrame, 
    window_size: int = 100, 
    step_size: int = 50
) -> List[pd.DataFrame]:
    """
    Create sliding/rolling windows from the preprocessed dataframe.
    """
    windows = []
    n = len(df)
    
    for start in range(0, n - window_size + 1, step_size):
        end = start + window_size
        window_df = df.iloc[start:end].copy()
        windows.append(window_df)
    
    return windows


def compute_window_correlations(
    windows: List[pd.DataFrame], 
    method: str = "pearson"
) -> List[Dict[str, Any]]:
    """
    Compute Pearson (or other) correlation matrix for each window.
    """
    correlation_results = []
    
    for idx, window in enumerate(windows):
        if len(window) < 2:
            continue  # skip tiny windows
            
        corr_matrix = window.corr(method=method)
        
        result = {
            "window_index": idx,
            "start_time": window.index[0],
            "end_time": window.index[-1],
            "window_size": len(window),
            "correlation_matrix": corr_matrix  # keep as DataFrame for easy access
        }
        correlation_results.append(result)
    
    return correlation_results


def compare_correlation_changes(
    correlation_results: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Compare correlation coefficients between consecutive windows.
    """
    changes = []
    if len(correlation_results) < 2:
        return changes

    for i in range(1, len(correlation_results)):
        prev = correlation_results[i-1]
        curr = correlation_results[i]

        prev_matrix = prev["correlation_matrix"]
        curr_matrix = curr["correlation_matrix"]

        common_streams = sorted(list(set(prev_matrix.columns) & set(curr_matrix.columns)))

        for stream1, stream2 in itertools.combinations(common_streams, 2):
            prev_corr = prev_matrix.loc[stream1, stream2]
            curr_corr = curr_matrix.loc[stream1, stream2]
            delta = abs(curr_corr - prev_corr)

            change = {
                "window_index": curr["window_index"],
                "start_time": curr["start_time"],
                "end_time": curr["end_time"],
                "stream_1": stream1,
                "stream_2": stream2,
                "previous_corr": float(prev_corr),
                "current_corr": float(curr_corr),
                "delta": float(delta)
            }
            changes.append(change)

    return changes


def generate_alerts(
    changes: List[Dict], 
    strong_corr_threshold: float = 0.7,
    weak_corr_threshold: float = 0.4,
    delta_threshold: float = 0.25
) -> List[Dict]:
    """
    Generate alerts for significant correlation changes.
    """
    alerts = []
    
    for change in changes:
        if change["delta"] >= delta_threshold:
            prev = change["previous_corr"]
            curr = change["current_corr"]

            if prev >= strong_corr_threshold and curr <= weak_corr_threshold:
                alert_level = "HIGH"
                reason = f"Strong correlation ({prev:.3f}) dropped to weak ({curr:.3f})"
            elif (prev > 0 and curr < 0) or (prev < 0 and curr > 0):
                alert_level = "MEDIUM"
                reason = f"Correlation sign changed from {prev:.3f} to {curr:.3f}"
            else:
                alert_level = "LOW"
                reason = f"Significant change detected: {prev:.3f} → {curr:.3f}"

            alert = change.copy()
            alert["alert_level"] = alert_level
            alert["reason"] = reason
            alerts.append(alert)

    return alerts


def detect_correlation_change_alert(
    df: pd.DataFrame,
    timestamp_col: str = "time",
    selected_streams: List[str] = None,
    window_size: int = 100,
    step_size: int = 50,
    method: str = "pearson",
    strong_corr_threshold: float = 0.7,
    weak_corr_threshold: float = 0.4,
    delta_threshold: float = 0.25
) -> Dict[str, Any]:
    """
    End-to-end pipeline: Preprocess → Windows → Correlations → Changes → Alerts
    """
    if selected_streams is None:
        selected_streams = [col for col in df.columns if col != timestamp_col]

    # Step 1: Preprocess
    processed_data = preprocess_timeseries(df, timestamp_col, selected_streams)

    # Step 2: Create windows
    windows = create_rolling_windows(processed_data, window_size, step_size)

    # Step 3: Compute correlations
    correlation_results = compute_window_correlations(windows, method=method)

    # Step 4: Compare changes
    changes = compare_correlation_changes(correlation_results)

    # Step 5: Generate alerts
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
        "alerts": alerts,
        "summary": {
            "total_windows": len(windows),
            "total_changes": len(changes),
            "total_alerts": len(alerts),
            "window_size": window_size,
            "step_size": step_size
        }
    }


# ====================== EXAMPLE USAGE ======================
if __name__ == "__main__":
    # Load your actual file
    df = pd.read_csv("simple.csv")   # Your uploaded file

    # Run the full pipeline
    result = detect_correlation_change_alert(
        df=df,
        timestamp_col="time",
        selected_streams=["s1", "s2", "s3"],
        window_size=100,      # Adjust as needed
        step_size=50,         # Overlapping windows
        delta_threshold=0.25  # Adjust sensitivity
    )

    # Summary
    print("=== Correlation Change Detection Summary ===")
    print(f"Total windows created     : {result['summary']['total_windows']}")
    print(f"Total pairwise changes    : {result['summary']['total_changes']}")
    print(f"Total alerts generated    : {result['summary']['total_alerts']}\n")

    # Show alerts (if any)
    if result["alerts"]:
        print("=== Detected Alerts ===")
        alerts_df = pd.DataFrame(result["alerts"])
        print(alerts_df[["window_index", "start_time", "stream_1", "stream_2", 
                        "previous_corr", "current_corr", "delta", "alert_level"]])
    else:
        print("No significant correlation changes detected.")

    # Optional: Save results
    # result["correlation_results"][0]["correlation_matrix"].to_csv("first_window_corr.csv")