import numpy as np

def normalize_data(df, time_col="data_point"):
    """
    Cleans and normalizes sensor data in a DataFrame:
      - Drops completely empty rows and columns.
      - Interpolates missing values in numeric columns.
      - Returns only numeric sensor columns along with the time column.

    Parameters:
        df (pd.DataFrame): Input DataFrame containing time and sensor streams.
        time_col (str): The name of the time/index column (default is 'data_point').

    Returns:
        pd.DataFrame: A new DataFrame with interpolated and cleaned numeric columns.
    """
    df = df.copy()
    df.dropna(how='all', inplace=True)  # Drop rows where all values are NaN
    df.dropna(axis=1, how='all', inplace=True)  # Drop columns where all values are NaN
    
    # Identify sensor columns (all columns except the time column)
    sensor_cols = [col for col in df.columns if col != time_col]
    
    # Keep only numeric columns among the sensor columns
    numeric_cols = df[sensor_cols].select_dtypes(include=[np.number]).columns.tolist()
    
    # Fill missing numeric values using linear interpolation
    df[numeric_cols] = df[numeric_cols].interpolate(method='linear', limit_direction='both')
    
    # Drop any remaining NaNs after interpolation, if they still exist
    df.dropna(how='any', inplace=True)
    
    return df[[time_col] + numeric_cols]
