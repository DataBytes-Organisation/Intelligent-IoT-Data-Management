import pandas as pd
import numpy as np

def normalize_data(df, time_col="data_point"):
    """
    Cleans and normalizes sensor data by removing empty values and interpolating missing readings.

    Parameters:
        df (DataFrame): The input DataFrame containing time series sensor data.
        time_col (str): The name of the column used as the time reference (default is "data_point").

    Returns:
        DataFrame: A cleaned and normalized DataFrame with time and numeric sensor values.
    """
    # Work on a copy to avoid modifying the original DataFrame
    df = df.copy()

    # Drop rows and columns that are completely empty
    df.dropna(how='all', inplace=True)
    df.dropna(axis=1, how='all', inplace=True)

    # Identify sensor columns (exclude time and datetime)
    sensor_cols = [col for col in df.columns if col not in [time_col, "datetime"]]

    # Keep only numeric sensor columns
    numeric_cols = df[sensor_cols].select_dtypes(include=[np.number]).columns.tolist()

    # Interpolate missing values linearly (forward and backward)
    df[numeric_cols] = df[numeric_cols].interpolate(method='linear', limit_direction='both')

    # Drop rows that still contain any missing values
    df.dropna(how='any', inplace=True)

    # Return the cleaned DataFrame with only relevant columns
    return df[[time_col, "datetime"] + numeric_cols]
