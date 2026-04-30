import pandas as pd
from typing import List

def create_rolling_windows(df: pd.DataFrame, 
                           window_size: int, 
                           step_size: int) -> List[pd.DataFrame]:
    """
    Creates rolling windows from a preprocessed time-series DataFrame.
    
    Parameters:
        df (pd.DataFrame): Preprocessed DataFrame containing ONLY numeric sensor columns.
        window_size (int): Number of timestamps in each window (e.g. 5 or 50).
        step_size (int): Step/stride between windows 
                        (1 = overlapping, window_size = non-overlapping).
    
    Returns:
        List[pd.DataFrame]: List of windowed DataFrames (one chunk per window).
    """
    windows = []
    n = len(df)
    
    for start in range(0, n - window_size + 1, step_size):
        end = start + window_size
        window = df.iloc[start:end].copy().reset_index(drop=True)
        windows.append(window)
    
    return windows