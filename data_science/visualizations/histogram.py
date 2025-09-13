import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import math


def histogram_plots(df, streams, start_date, end_date, bins=10, style='default'):
    """
    Create histograms for each specified stream over a given time range, with style options.

    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing data with a 'created_at' column and numeric fields.
    streams : list of str
        List of column names (streams) for which histograms will be plotted.
    start_date : str or datetime
        Start datetime (e.g., '2025-03-18 06:54:00').
    end_date : str or datetime
        End datetime (e.g., '2025-03-18 06:59:59').
    bins : int, optional
        Number of bins for the histogram (default is 10).
    style : str, optional
        Style of the plot. Options include:
            - 'default': Standard style.
            - 'minimal': Clean design with minimal clutter.
            - 'vibrant': Bold markers and colors.
            - 'dark': Dark background style.
            - 'modern': Modern style with a sleek look.
            - 'pastel': Soft pastel colors.
            - 'grayscale': Monochrome style.

    Returns:
    --------
    None
        Displays histograms for each stream.
    """
    # Define style parameters (using valid matplotlib style names where applicable)
    styles = {
        'default': {'plt_style': None},
        'minimal': {'plt_style': None},
        'vibrant': {'plt_style': None},
        'dark': {'plt_style': 'dark_background'},
        'modern': {'plt_style': 'seaborn-v0_8-ticks'},
        'pastel': {'plt_style': 'seaborn-v0_8-white'},
        'grayscale': {'plt_style': 'grayscale'}
    }

    style_settings = styles.get(style, styles['default'])
    if style_settings['plt_style']:
        plt.style.use(style_settings['plt_style'])
    else:
        plt.style.use('default')

    # Convert 'created_at' to datetime and remove timezone information
    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)

    # Filter the DataFrame based on the provided date range
    mask = (df['created_at'] >= pd.to_datetime(start_date)) & (df['created_at'] <= pd.to_datetime(end_date))
    df_filtered = df.loc[mask].copy()

    n_streams = len(streams)
    cols = math.ceil(math.sqrt(n_streams))
    rows = math.ceil(n_streams / cols)

    fig, axes = plt.subplots(rows, cols, figsize=(5 * cols, 4 * rows))

    # Flatten axes array for easy iteration
    if n_streams == 1:
        axes = [axes]
    else:
        axes = axes.flatten()

    for ax, stream in zip(axes, streams):
        # Plot histogram for each stream
        ax.hist(df_filtered[stream].dropna(), bins=bins, edgecolor='black')
        ax.set_title(f'Histogram of {stream}')
        ax.set_xlabel(stream)
        ax.set_ylabel('Frequency')

    # Remove any extra subplots if present
    for ax in axes[n_streams:]:
        ax.remove()

    plt.tight_layout()
    plt.show()
