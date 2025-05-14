import matplotlib.pyplot as plt
import numpy as np

def plot_with_correlation(df, correlations, window_size, time_col="data_point"):
    """
    Plots the selected sensor streams along with their correlations over time.

    Parameters:
        df (pd.DataFrame): DataFrame containing the time column and sensor data.
        correlations (dict): Dictionary with correlation values for each stream pair.
        window_size (int): Size of the sliding window used for correlations.
        time_col (str): Name of the time column.
    """
    stream_cols = df.columns.drop(time_col)
    t = df[time_col].values

    # Loop through each pair of streams and plot the data and correlation
    for (s1, s2), corr_values in correlations.items():
        fig, ax = plt.subplots(figsize=(10, 5))

        ax.plot(t, df[s1], label=s1)
        ax.plot(t, df[s2], label=s2)

        corr_x = np.arange(window_size - 1, len(df))
        corr_plot = np.full(len(df), np.nan)
        corr_plot[window_size - 1:] = corr_values
        ax.plot(t, corr_plot, label=f"Correlation({s1},{s2})", color='red')

        ax.set_title(f"Time Series & Correlation: {s1} & {s2}")
        ax.set_xlabel("Data Point")
        ax.set_ylabel("Normalized Values")
        ax.legend()

        fig.tight_layout()
        plt.show()