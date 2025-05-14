import matplotlib.pyplot as plt
import numpy as np

def plot_all_correlations(df, correlations, window_size):
    """
    Plots the sliding window correlation values for each pair of sensor streams.

    Parameters:
        df (DataFrame): The original or normalized DataFrame containing the "data_point" column.
        correlations (dict): Dictionary of correlation results from compute_sliding_correlations().
                             Keys are sensor column pairs (tuple), values are lists of correlation values.
        window_size (int): The window size used in computing the correlations (for padding purposes).

    Returns:
        None
    """
    # Use the time reference column for x-axis
    t = df["data_point"].values

    # Initialize plot
    plt.figure(figsize=(12, 6))

    # Plot each sensor pair's correlation curve
    for (s1, s2), corr_values in correlations.items():
        # Pad the correlation list so it aligns with the original time points
        padded_corr = [np.nan] * (window_size - 1) + corr_values
        plt.plot(t, padded_corr, label=f"Corr({s1},{s2})")

    # Add labels and formatting
    plt.title("Sliding Window Correlations")
    plt.xlabel("Data Point")
    plt.ylabel("Correlation")
    plt.legend()
    plt.tight_layout()
    plt.show()
