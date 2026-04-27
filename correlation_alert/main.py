import pandas as pd

from preprocessing import (
    fix_timestamps,
    convert_sensor_columns_to_numeric,
    handle_missing_values,
    remove_outliers,
    validate_output
)


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


# Testing/demo only.
# This block is not required by the reusable pipeline.
if __name__ == "__main__":
    df = pd.read_csv("datasets/complex.csv")

    timestamp_col = "time"
    selected_streams = [col for col in df.columns if col != timestamp_col]

    processed_data = preprocess_timeseries(
        df,
        timestamp_col,
        selected_streams
    )

    print(processed_data.head())
    print(f"Processed data shape: {processed_data.shape}")