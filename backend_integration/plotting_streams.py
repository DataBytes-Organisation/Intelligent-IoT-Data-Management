import matplotlib.pyplot as plt
import numpy as np
from correlation import compute_correlation_in_window

def plot_pairwise_highlighted(df, selected_streams, start_dt, end_dt):
    """
    Plots each unique pair of selected sensor streams with their values over time,
    highlighting the specified datetime window and displaying the correlation within that window.

    Parameters:
        df (DataFrame): The normalized time series DataFrame with a "datetime" column.
        selected_streams (list): List of selected sensor column names (e.g., ["s1", "s2", "s3"]).
        start_dt (datetime): Start of the highlighted time window.
        end_dt (datetime): End of the highlighted time window.

    Returns:
        None
    """
    # Iterate over all unique pairs of selected sensor streams
    for i in range(len(selected_streams)):
        for j in range(i + 1, len(selected_streams)):
            s1, s2 = selected_streams[i], selected_streams[j]

            # Create a new figure for each pair
            fig, ax = plt.subplots(figsize=(10, 5))

            # Plot sensor values over time
            ax.plot(df["datetime"], df[s1], label=s1)
            ax.plot(df["datetime"], df[s2], label=s2)

            # Highlight the selected datetime window
            ax.axvspan(start_dt, end_dt, color='orange', alpha=0.3)

            # Compute correlation in the highlighted window
            corr = compute_correlation_in_window(df, s1, s2, start_dt, end_dt)

            # Annotate the plot with the correlation value
            ax.text(0.01, 0.95, f"Corr({s1},{s2}) = {corr:.3f}", transform=ax.transAxes,
                    fontsize=10, verticalalignment='top',
                    bbox=dict(facecolor='white', alpha=0.6))

            # Set plot titles and labels
            ax.set_title(f"{s1} vs {s2} with Highlighted Window")
            ax.set_xlabel("Datetime")
            ax.set_ylabel("Sensor Value")
            ax.legend()

            # Adjust layout and display the plot
            fig.tight_layout()
            plt.show()
