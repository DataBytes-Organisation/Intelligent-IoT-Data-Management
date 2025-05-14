def compute_correlation_in_window(df, col1, col2, start_dt, end_dt):
    """
    Computes the Pearson correlation between two sensor columns within a specified datetime range.

    Parameters:
        df (DataFrame): The normalized time series DataFrame.
        col1 (str): Name of the first sensor column.
        col2 (str): Name of the second sensor column.
        start_dt (datetime): Start of the time window (inclusive).
        end_dt (datetime): End of the time window (inclusive).

    Returns:
        float: Pearson correlation coefficient between col1 and col2 within the given datetime range.
    """
    # Create a mask to filter rows within the specified datetime range
    mask = (df['datetime'] >= start_dt) & (df['datetime'] <= end_dt)

    # Extract the relevant subset of the DataFrame
    sub_df = df.loc[mask, [col1, col2]]

    # Compute and return the Pearson correlation
    return sub_df[col1].corr(sub_df[col2])
