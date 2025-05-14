import pandas as pd

def load_data(csv_file):
    """
    Loads time series data from a CSV file, assumes the first column contains 
    date/time or sequential information, replaces it with numeric indices, 
    and returns the processed DataFrame along with the index range and time column name.
    
    Parameters:
        csv_file (str): Path to the CSV file.

    Returns:
        df (pd.DataFrame): DataFrame with 'data_point' as the time/index column.
        min_dp (int): Minimum value of the data point index.
        max_dp (int): Maximum value of the data point index.
        time_col (str): Name of the new time/index column ('data_point').
    """
    # Read the CSV file into a DataFrame
    df = pd.read_csv(csv_file)
    
    # Rename the first column to 'data_point' and replace with sequential indices
    original_time_col = df.columns[0]
    df.rename(columns={original_time_col: "data_point"}, inplace=True)
    df["data_point"] = list(range(len(df)))
    
    # Get the minimum and maximum values for the data point index
    min_dp = df["data_point"].min()
    max_dp = df["data_point"].max()
    
    return df, min_dp, max_dp, "data_point"