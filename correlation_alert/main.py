import pandas as pd
import numpy as np
from itertools import combinations


def preprocess_timeseries(df, timestamp_col, selected_streams):
    required_cols = [timestamp_col] + selected_streams
    processed_df = df[required_cols].copy()

    processed_df[timestamp_col] = pd.to_numeric(processed_df[timestamp_col], errors="coerce")
    processed_df = processed_df.dropna(subset=[timestamp_col])

    for col in selected_streams:
        processed_df[col] = pd.to_numeric(processed_df[col], errors="coerce")

    processed_df = processed_df.sort_values(by=timestamp_col)
    processed_df = processed_df.drop_duplicates(subset=[timestamp_col])

    processed_df = processed_df.set_index(timestamp_col)

    processed_df = processed_df.interpolate(method="linear", limit_direction="both")
    processed_df = processed_df.ffill().bfill()

    return processed_df


def create_rolling_windows(df, window_size, step_size):
    windows = []
    for start in range(0, len(df) - window_size + 1, step_size):
        window = df.iloc[start:start + window_size].copy()
        windows.append(window)
    return windows


def compute_window_correlations(windows, method="pearson"):
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
    alerts = []

    for ch in changes:
        prev_corr = ch["previous_corr"]
        curr_corr = ch["current_corr"]
        delta = ch["delta"]

        reasons = []
        level = None

        prev_abs = abs(prev_corr)
        curr_abs = abs(curr_corr)

        if delta >= delta_threshold:
            reasons.append("Significant correlation change")

        if prev_abs >= strong_corr_threshold and curr_abs <= weak_corr_threshold:
            reasons.append("Strong → Weak drop")
            level = "high"

        elif prev_abs <= weak_corr_threshold and curr_abs >= strong_corr_threshold:
            reasons.append("Weak → Strong increase")
            if level is None:
                level = "medium"

        if np.sign(prev_corr) != np.sign(curr_corr):
            reasons.append("Sign change")
            if level is None:
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
    timestamp_col,
    selected_streams,
    window_size=30,
    step_size=5,
    method="pearson",
    strong_corr_threshold=0.7,
    weak_corr_threshold=0.4,
    delta_threshold=0.3
):

    processed_data = preprocess_timeseries(df, timestamp_col, selected_streams)

    windows = create_rolling_windows(processed_data, window_size, step_size)

    correlation_results = compute_window_correlations(windows, method)

    changes = compare_correlation_changes(correlation_results)

    alerts = generate_alerts(
        changes,
        strong_corr_threshold,
        weak_corr_threshold,
        delta_threshold
    )

    return {
        "processed_data": processed_data,
        "windows": windows,
        "correlation_results": correlation_results,
        "changes": changes,
        "alerts": alerts
    }


# ========================= RUN PIPELINE =========================
if __name__ == "__main__":

    df = pd.read_csv("datasets/complex.csv")

    timestamp_col = "time"
    selected_streams = [col for col in df.columns if col != timestamp_col]

    results = detect_correlation_change_alert(
        df,
        timestamp_col,
        selected_streams
    )

    # ================= SAVE FILES =================
    results["processed_data"].reset_index().to_csv(
        "datasets/clean_sensor_data.csv", index=False
    )

    pd.DataFrame(results["alerts"]).to_csv(
        "datasets/alerts.csv", index=False
    )

    pd.DataFrame(results["changes"]).to_csv(
        "datasets/correlation_changes.csv", index=False
    )

    # ================= CLEAN SUMMARY =================
    print("\n=== SUMMARY ===")
    print(f"Rows after preprocessing: {len(results['processed_data'])}")
    print(f"Windows: {len(results['windows'])}")
    print(f"Changes detected: {len(results['changes'])}")
    print(f"Alerts: {len(results['alerts'])}")

    print("\nFiles saved:")
    print("- datasets/clean_sensor_data.csv")
    print("- datasets/alerts.csv")
    print("- datasets/correlation_changes.csv")

    # ================= DETAILED OUTPUT =================
    print("\n=== DETAILED OUTPUT ===")

    print("\nProcessed Data (first 5 rows):")
    print(results["processed_data"].head())

    print("\nSample Alerts:")
    alerts_df = pd.DataFrame(results["alerts"])
    print(alerts_df.head())

    print("\nSample Changes:")
    changes_df = pd.DataFrame(results["changes"])
    print(changes_df.head())