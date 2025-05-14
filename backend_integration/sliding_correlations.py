def compute_sliding_correlations(df, window_size, time_col="data_point"):
    """
    Computes pairwise Pearson correlation coefficients between sensor streams
    using a sliding window approach.

    Parameters:
        df (DataFrame): The normalized time series DataFrame.
        window_size (int): The number of rows (time steps) in each sliding window.
        time_col (str): The name of the time index column (default is "data_point").

    Returns:
        dict: A dictionary where keys are tuples of sensor pairs (col1, col2),
              and values are lists of correlation coefficients computed over each window.
    """
    # Get the list of sensor columns (excluding time and datetime)
    stream_cols = df.columns.drop([time_col, "datetime"])

    correlations = {}

    # Iterate over all unique pairs of sensor columns
    for i in range(len(stream_cols)):
        for j in range(i + 1, len(stream_cols)):
            pair = (stream_cols[i], stream_cols[j])
            corrs = []

            # Slide the window across the data and compute correlation
            for start in range(0, len(df) - window_size + 1):
                window = df.iloc[start:start + window_size]
                corr = window[stream_cols[i]].corr(window[stream_cols[j]])
                corrs.append(corr)

            # Store correlation values for the sensor pair
            correlations[pair] = corrs

    return correlations
