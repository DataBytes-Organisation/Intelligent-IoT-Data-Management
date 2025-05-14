def compute_sliding_correlations(df, window_size, time_col="data_point"):
    """
    Calculates and returns sliding window correlations between sensor streams.

    Parameters:
        df (pd.DataFrame): DataFrame containing sensor data.
        window_size (int): Size of the sliding window.
        time_col (str): Name of the time column.

    Returns:
        correlations (dict): Dictionary with correlations between stream pairs.
    """
    stream_cols = df.columns.drop(time_col)
    correlations = {}

    # Compute correlations for each pair of streams
    for i in range(len(stream_cols)):
        for j in range(i + 1, len(stream_cols)):
            pair = (stream_cols[i], stream_cols[j])
            corrs = []
            for start in range(0, len(df) - window_size + 1):
                window = df.iloc[start:start + window_size]
                corr = window[stream_cols[i]].corr(window[stream_cols[j]])
                corrs.append(corr)
            correlations[pair] = corrs
    return correlations