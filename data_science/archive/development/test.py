import pandas as pd
from datetime import datetime, timedelta
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def get_dataset(csv_file, time_col="data_point", window_size=15, output_dir="datasets"):
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
    normalized_df = df[[time_col, "datetime"] + numeric_cols]

    # Get the list of sensor columns (excluding time and datetime)
    stream_cols = normalized_df.columns.drop([time_col, "datetime"])

    correlations = {}

    # Iterate over all unique pairs of sensor columns
    for i in range(len(stream_cols)):
        for j in range(i + 1, len(stream_cols)):
            pair = (stream_cols[i], stream_cols[j])
            corrs = []

            # Slide the window across the data and compute correlation
            for start in range(0, len(normalized_df) - window_size + 1):
                window = normalized_df.iloc[start:start + window_size]
                corr = window[stream_cols[i]].corr(window[stream_cols[j]])
                corrs.append(corr)

            # Store correlation values for the sensor pair
            correlations[pair] = corrs

    # return correlations
    df_to_save = df.copy()
    # Add each correlation result as a new column
    for (s1, s2), corr_values in correlations.items():
        # Construct a short column name for the pair (e.g., c(1, 2))
        col_name = f"c({s1[-1]}, {s2[-1]})"

        # Pad the correlation list to align with the full DataFrame length
        padded_corr = [None] * (len(df_to_save) - len(corr_values)) + corr_values

        # Add the padded correlation values as a new column
        df_to_save[col_name] = padded_corr

    # Define the full output path and save the DataFrame as CSV
    output_path = os.path.join("data_science", output_dir, "complex_formatted.csv")

    print('output_path',output_path)

    df_to_save.to_csv(output_path, index=False)

    # Notify the user of the saved file
    print(f"Saved: {output_path}")
    return output_path


def get_corr(
    csv_file,
    time_col="data_point",
    window_size=15,
    output_dir="datasets/",
    start_year=2025,
    start_month=1,
    start_day=1,
    start_hour=0,
    start_minute=0,
    start_second=0,
    end_year=2025,
    end_month=1,
    end_day=6,
    end_hour=0,
    end_minute=10,
    end_second=0
):
    print('get_corr')
    print('start_year', start_year)
    print('start_month', start_month)
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
    normalized_df = df[[time_col, "datetime"] + numeric_cols]

    # Get the list of sensor columns (excluding time and datetime)
    selected_streams = normalized_df.columns.drop([time_col, "datetime"])

    # --- Parse datetime ranges from GUI ---
    start_dt = datetime(
        start_year, start_month, start_day,
        start_hour, start_minute, start_second
    )
    end_dt = datetime(
        end_year, end_month, end_day,
        end_hour, end_minute, end_second
    )
    corrs = {}
    #########
    for i in range(len(selected_streams)):
        for j in range(i + 1, len(selected_streams)):
            s1, s2 = selected_streams[i], selected_streams[j]
            mask = (df['datetime'] >= start_dt) & (df['datetime'] <= end_dt)
            sub_df = df.loc[mask, [s1, s2]]
            corr = sub_df[s1].corr(sub_df[s2])
            # corrs[(s1, s2)] = corr
            corrs[s1 + "-" + s2] = corr
    print(corrs)
    return corrs







script_dir = os.path.dirname(os.path.abspath(__file__))
datasets_dir = os.path.abspath(os.path.join(script_dir, os.pardir, "datasets"))
os.makedirs(datasets_dir, exist_ok=True)
data_path = os.path.join(datasets_dir, "complex.csv")
get_corr(
    csv_file=data_path,
    time_col="data_point",
    window_size=15,
    output_dir=datasets_dir
)