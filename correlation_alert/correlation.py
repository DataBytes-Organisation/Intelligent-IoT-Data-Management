from itertools import combinations

import pandas as pd

from .preprocessing import InputValidationError


DEFAULT_WINDOW_SIZE = 20
DEFAULT_STEP_SIZE = 10
DEFAULT_METHOD = "pearson"
DEFAULT_STRONG_THRESHOLD = 0.7
DEFAULT_WEAK_THRESHOLD = 0.4
DEFAULT_DELTA_THRESHOLD = 0.3
DEFAULT_MEDIUM_THRESHOLD = 0.5
DEFAULT_HIGH_THRESHOLD = 0.7
VALID_METHODS = {"pearson", "spearman"}
SEVERITY_RANK = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}


def _require_positive_integer(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise InputValidationError(f"{name} must be a positive integer")


def _require_number(value, name, minimum, maximum):
    if isinstance(value, bool):
        raise InputValidationError(f"{name} must be numeric")

    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise InputValidationError(f"{name} must be numeric") from exc

    if not minimum <= numeric <= maximum:
        raise InputValidationError(f"{name} must be between {minimum} and {maximum}")
    return numeric


def validate_correlation_parameters(
    window_size,
    step_size,
    method,
    strong_corr_threshold,
    weak_corr_threshold,
    delta_threshold,
    medium_threshold,
    high_threshold,
    row_count=None,
):
    """Validate window, method, and threshold configuration."""
    _require_positive_integer(window_size, "window_size")
    _require_positive_integer(step_size, "step_size")
    if row_count is not None and window_size > row_count:
        raise InputValidationError("window_size cannot exceed the number of processed rows")
    if method not in VALID_METHODS:
        raise InputValidationError(f"method must be one of {sorted(VALID_METHODS)}")

    _require_number(strong_corr_threshold, "strong_corr_threshold", -1, 1)
    _require_number(weak_corr_threshold, "weak_corr_threshold", -1, 1)
    _require_number(delta_threshold, "delta_threshold", 0, 2)
    _require_number(medium_threshold, "medium_threshold", 0, 2)
    _require_number(high_threshold, "high_threshold", 0, 2)

    if weak_corr_threshold >= strong_corr_threshold:
        raise InputValidationError("weak_corr_threshold must be below strong_corr_threshold")
    if medium_threshold >= high_threshold:
        raise InputValidationError("medium_threshold must be below high_threshold")


def create_rolling_windows(df, window_size, step_size):
    """Create complete row based sliding windows."""
    _require_positive_integer(window_size, "window_size")
    _require_positive_integer(step_size, "step_size")
    if window_size > len(df):
        raise InputValidationError("window_size cannot exceed the number of processed rows")

    return [
        df.iloc[start : start + window_size]
        for start in range(0, len(df) - window_size + 1, step_size)
    ]


def compute_window_correlations(windows, method=DEFAULT_METHOD, min_periods=1):
    """Compute one correlation matrix for each window."""
    if method not in VALID_METHODS:
        raise InputValidationError(f"method must be one of {sorted(VALID_METHODS)}")

    results = []
    for index, window in enumerate(windows):
        if len(window) < 2:
            raise InputValidationError("Every window must contain at least 2 rows")
        results.append(
            {
                "window_index": index,
                "start_time": window.index[0],
                "end_time": window.index[-1],
                "window_size": len(window),
                "correlation_matrix": window.corr(
                    method=method,
                    min_periods=min_periods,
                ),
            }
        )
    return results


def compare_correlation_changes(correlation_results):
    """Compare consecutive matrices without rounding analytical values."""
    if not isinstance(correlation_results, list):
        raise InputValidationError("correlation_results must be a list")

    changes = []
    skipped_pairs = []
    for index in range(1, len(correlation_results)):
        previous = correlation_results[index - 1]
        current = correlation_results[index]
        previous_matrix = previous["correlation_matrix"]
        current_matrix = current["correlation_matrix"]

        if list(previous_matrix.columns) != list(current_matrix.columns):
            raise InputValidationError("Correlation matrices must contain the same streams")

        for stream_1, stream_2 in combinations(previous_matrix.columns, 2):
            previous_value = previous_matrix.loc[stream_1, stream_2]
            current_value = current_matrix.loc[stream_1, stream_2]
            common = {
                "window_index": current["window_index"],
                "start_time": current["start_time"],
                "end_time": current["end_time"],
                "stream_1": stream_1,
                "stream_2": stream_2,
            }

            if pd.isna(previous_value) or pd.isna(current_value):
                skipped_pairs.append({**common, "reason": "undefined_correlation"})
                continue

            previous_float = float(previous_value)
            current_float = float(current_value)
            changes.append(
                {
                    **common,
                    "previous_corr": previous_float,
                    "current_corr": current_float,
                    "delta": abs(current_float - previous_float),
                }
            )
    return changes, skipped_pairs


def get_alert_level(
    delta,
    delta_threshold=DEFAULT_DELTA_THRESHOLD,
    medium_threshold=DEFAULT_MEDIUM_THRESHOLD,
    high_threshold=DEFAULT_HIGH_THRESHOLD,
):
    """Classify one correlation delta using a single severity rule."""
    try:
        value = float(delta)
    except (TypeError, ValueError):
        return None

    if pd.isna(value) or value < delta_threshold:
        return None
    if value < medium_threshold:
        return "LOW"
    if value < high_threshold:
        return "MEDIUM"
    return "HIGH"


def _at_least_medium(alert_level):
    if SEVERITY_RANK[alert_level] < SEVERITY_RANK["MEDIUM"]:
        return "MEDIUM"
    return alert_level


def generate_alerts(
    changes,
    strong_corr_threshold=DEFAULT_STRONG_THRESHOLD,
    weak_corr_threshold=DEFAULT_WEAK_THRESHOLD,
    delta_threshold=DEFAULT_DELTA_THRESHOLD,
    medium_threshold=DEFAULT_MEDIUM_THRESHOLD,
    high_threshold=DEFAULT_HIGH_THRESHOLD,
):
    """Generate alerts from correlation changes and strength transitions."""
    alerts = []
    for change in changes:
        delta = change["delta"]
        alert_level = get_alert_level(
            delta,
            delta_threshold,
            medium_threshold,
            high_threshold,
        )
        if alert_level is None:
            continue

        previous = change["previous_corr"]
        current = change["current_corr"]
        previous_strength = abs(previous)
        current_strength = abs(current)

        if previous_strength >= strong_corr_threshold and current_strength <= weak_corr_threshold:
            alert_level = _at_least_medium(alert_level)
            reason = f"Strong-to-weak change: correlation went from {previous:.2f} to {current:.2f}"
        elif previous_strength <= weak_corr_threshold and current_strength >= strong_corr_threshold:
            alert_level = _at_least_medium(alert_level)
            reason = f"Weak-to-strong change: correlation went from {previous:.2f} to {current:.2f}"
        else:
            reason = f"Correlation changed by {delta:.2f}, classified as {alert_level} severity"

        alerts.append(create_alert(change, alert_level, reason))
    return alerts


def create_alert(change, alert_level, reason):
    """Build one stable alert record."""
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
        "reason": reason,
    }


def run_correlation_pipeline(
    processed_data,
    window_size=DEFAULT_WINDOW_SIZE,
    step_size=DEFAULT_STEP_SIZE,
    method=DEFAULT_METHOD,
    strong_corr_threshold=DEFAULT_STRONG_THRESHOLD,
    weak_corr_threshold=DEFAULT_WEAK_THRESHOLD,
    delta_threshold=DEFAULT_DELTA_THRESHOLD,
    medium_threshold=DEFAULT_MEDIUM_THRESHOLD,
    high_threshold=DEFAULT_HIGH_THRESHOLD,
):
    """Run the complete correlation and alert flow."""
    validate_correlation_parameters(
        window_size,
        step_size,
        method,
        strong_corr_threshold,
        weak_corr_threshold,
        delta_threshold,
        medium_threshold,
        high_threshold,
        row_count=len(processed_data),
    )
    windows = create_rolling_windows(processed_data, window_size, step_size)
    correlation_results = compute_window_correlations(windows, method)
    changes, skipped_pairs = compare_correlation_changes(correlation_results)
    alerts = generate_alerts(
        changes,
        strong_corr_threshold,
        weak_corr_threshold,
        delta_threshold,
        medium_threshold,
        high_threshold,
    )
    return {
        "windows": windows,
        "correlation_results": correlation_results,
        "changes": changes,
        "alerts": alerts,
        "skipped_pairs": skipped_pairs,
    }
