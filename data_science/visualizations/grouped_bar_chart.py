import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np


def grouped_bar_chart(df, streams, start_date, end_date):
    """
    Create a grouped bar chart for the specified streams, grouping by minute.

    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing the data with a 'created_at' column and numeric fields.
    streams : list of str
        List of column names (streams) to plot.
    start_date : str or datetime
        Start datetime (e.g., '2025-03-18 06:54:00').
    end_date : str or datetime
        End datetime (e.g., '2025-03-18 06:59:59').

    Returns:
    --------
    None
        Displays the grouped bar chart.
    """
    # Convert 'created_at' to datetime and remove timezone to make it naive
    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)

    # Filter the DataFrame based on the provided date range
    mask = (df['created_at'] >= pd.to_datetime(start_date)) & (df['created_at'] <= pd.to_datetime(end_date))
    df_filtered = df.loc[mask].copy()

    # Create a new column that floors the timestamp to the minute for grouping
    df_filtered['minute'] = df_filtered['created_at'].dt.floor('min')

    # Group by minute and aggregate the streams (using sum; change to mean() if desired)
    grouped_data = df_filtered.groupby('minute')[streams].sum().reset_index()

    # Create x positions for each minute group
    x = np.arange(len(grouped_data))
    width = 0.8 / len(streams)  # Adjust width so that all bars in a group fit nicely

    fig, ax = plt.subplots(figsize=(10, 6))

    # Plot each stream as a set of bars with an offset
    for i, stream in enumerate(streams):
        ax.bar(
            x + i * width,
            grouped_data[stream],
            width,
            label=stream
        )

    # Set x-ticks in the middle of each group
    ax.set_xticks(x + (len(streams) - 1) * width / 2)
    # Format the minute as a string (e.g., '06:54')
    ax.set_xticklabels(grouped_data['minute'].dt.strftime('%H:%M'))

    ax.set_xlabel('Time (Minute)')
    ax.set_ylabel('Aggregated Value')
    ax.set_title('Grouped Bar Chart by Minute')
    ax.legend(title='Streams')

    plt.tight_layout()
    plt.show()
