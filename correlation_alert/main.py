from .correlation import (
    DEFAULT_DELTA_THRESHOLD,
    DEFAULT_HIGH_THRESHOLD,
    DEFAULT_MEDIUM_THRESHOLD,
    DEFAULT_METHOD,
    DEFAULT_STEP_SIZE,
    DEFAULT_STRONG_THRESHOLD,
    DEFAULT_WEAK_THRESHOLD,
    DEFAULT_WINDOW_SIZE,
    run_correlation_pipeline,
)
from .preprocessing import run_preprocessing_pipeline


def detect_correlation_change_alert(
    df,
    timestamp_col,
    selected_streams,
    window_size=DEFAULT_WINDOW_SIZE,
    step_size=DEFAULT_STEP_SIZE,
    method=DEFAULT_METHOD,
    strong_corr_threshold=DEFAULT_STRONG_THRESHOLD,
    weak_corr_threshold=DEFAULT_WEAK_THRESHOLD,
    delta_threshold=DEFAULT_DELTA_THRESHOLD,
    medium_threshold=DEFAULT_MEDIUM_THRESHOLD,
    high_threshold=DEFAULT_HIGH_THRESHOLD,
    sampling_frequency=None,
    missing_method="interpolate",
    iqr_factor=3.0,
):
    """Run preprocessing, correlation analysis, and alert generation."""
    processed_data = run_preprocessing_pipeline(
        df,
        timestamp_col,
        selected_streams,
        missing_method=missing_method,
        iqr_factor=iqr_factor,
        sampling_frequency=sampling_frequency,
    )
    correlation_output = run_correlation_pipeline(
        processed_data,
        window_size=window_size,
        step_size=step_size,
        method=method,
        strong_corr_threshold=strong_corr_threshold,
        weak_corr_threshold=weak_corr_threshold,
        delta_threshold=delta_threshold,
        medium_threshold=medium_threshold,
        high_threshold=high_threshold,
    )
    return {
        "processed_data": processed_data,
        **correlation_output,
        "data_quality": processed_data.attrs.get("data_quality", {}),
    }
