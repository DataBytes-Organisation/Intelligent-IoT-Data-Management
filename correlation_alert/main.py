import pandas as pd
from itertools import combinations

# Import preprocessing function (THIS is what reviewer asked)
from preprocessing import run_pipeline


def create_rolling_windows(df, window_size, step_size):
    """
    Split the cleaned dataframe into rolling windows.
    """
    windows = []
    for start in range(0, len(df) - window_size + 1, step_size):
        window = df.iloc[start:start + window_size].copy()
        windows.append(window)
    return windows


def compute_window_correlations(windows, method="pearson"):
    """
    Compute correlation matrix for each window.
    """
    results = []

    for i, window in enumerate(windows):
        corr_matrix = window.corr(method=method)

        results.append({
            "window_index": i,
            "start_time": window.index.min(),
            "end_time": window.index.max(),
            "correlation_matrix": corr_matrix
        })

    return results


def compare_correlation_changes(correlation_results):
    """
    Compare correlations between consecutive windows.
    """
    changes = []

    for i in range(1, len(correlation_results)):
        prev = correlation_results[i - 1]
        curr = correlation_results[i]

        prev_corr = prev["correlation_matrix"]
        curr_corr = curr["correlation_matrix"]

        for s1, s2 in combinations(curr_corr.columns, 2):
            p = prev_corr.loc[s1, s2]
            c = curr_corr.loc[s1, s2]

            if pd.isna(p) or pd.isna(c):
                continue

            delta = abs(c - p)

            changes.append({
                "window_index": curr["window_index"],
                "start_time": curr["start_time"],
                "end_time": curr["end_time"],
                "stream_1": s1,
                "stream_2": s2,
                "previous_corr": p,
                "current_corr": c,
                "delta": delta
            })

    return changes


def generate_alerts(changes, strong_corr_threshold=0.7, weak_corr_threshold=0.4, delta_threshold=0.3):
    """
    Generate alerts based on correlation changes.
    """
    alerts = []

    for ch in changes:
        prev_corr = ch["previous_corr"]
        curr_corr = ch["current_corr"]
        delta = ch["delta"]

        reasons = []
        level = None

        # Check for large change in correlation
        if delta >= delta_threshold:
            reasons.append("Significant correlation change")

        # Strong to weak drop
        if abs(prev_corr) >= strong_corr_threshold and abs(curr_corr) <= weak_corr_threshold:
            reasons.append("Strong → Weak drop")
            level = "high"

        # Weak to strong increase
        elif abs(prev_corr) <= weak_corr_threshold and abs(curr_corr) >= strong_corr_threshold:
            reasons.append("Weak → Strong increase")
            level = "medium"

        if reasons:
            alerts.append({
                **ch,
                "alert_level": level if level else "medium",
                "reason": "; ".join(reasons)
            })

    return alerts


def detect_correlation_change_alert(
    df,
    window_size=30,
    step_size=5
):
    """
    Main wrapper for correlation alert pipeline.
    """

    # Step 1: Create rolling windows
    windows = create_rolling_windows(df, window_size, step_size)

    # Step 2: Compute correlations
    correlation_results = compute_window_correlations(windows)

    # Step 3: Compare changes
    changes = compare_correlation_changes(correlation_results)

    # Step 4: Generate alerts
    alerts = generate_alerts(changes)

    return {
        "windows": windows,
        "correlation_results": correlation_results,
        "changes": changes,
        "alerts": alerts
    }


# DEMO / TEST ONLY 
#  Keep dataset usage only for testing, not core logic
if __name__ == "__main__":

    # Use preprocessing pipeline 
    clean_df = run_pipeline("datasets/complex.csv")

    # Set index for correlation analysis
    clean_df = clean_df.set_index("time")

    # Run detection
    results = detect_correlation_change_alert(clean_df)

    # Print summary only 
    print("\n=== SUMMARY ===")
    print(f"Windows: {len(results['windows'])}")
    print(f"Changes detected: {len(results['changes'])}")
    print(f"Alerts: {len(results['alerts'])}")