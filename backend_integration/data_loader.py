import pandas as pd
from datetime import datetime, timedelta

def load_data(csv_file):
    """
    Loads and preprocesses time series sensor data from a CSV file.

    Parameters:
        csv_file (str): Path to the CSV file containing the data.

    Returns:
        df (DataFrame): Processed DataFrame with standardized column names and datetime values.
        min_dp (int): Minimum data point index.
        max_dp (int): Maximum data point index.
        time_col (str): Name of the time reference column ("data_point").
    """
    # Load the CSV file into a DataFrame
    df = pd.read_csv(csv_file)

    # Strip any whitespace from column names
    df.columns = df.columns.str.strip()

    # Standardize the first column as "data_point"
    original_time_col = df.columns[0]
    df.rename(columns={original_time_col: "data_point"}, inplace=True)

    # Replace the original time data with a sequential index
    df["data_point"] = list(range(len(df)))

    # Generate a datetime column assuming a uniform 10-minute interval starting from Jan 1, 2025
    df["datetime"] = [datetime(2025, 1, 1, 0, 0) + timedelta(minutes=10 * i) for i in range(len(df))]

    # Determine the min and max values of the data_point index
    min_dp = df["data_point"].min()
    max_dp = df["data_point"].max()

    # Return the processed DataFrame and metadata
    return df, min_dp, max_dp, "data_point"
