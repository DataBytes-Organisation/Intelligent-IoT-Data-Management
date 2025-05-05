import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.dates as mdates
import itertools
import math


def scatter_plot(df, streams, start_date, end_date, style='default'):
    """
    Create scatter plots for each pair of streams over a specified time range,
    including a linear regression line, with various style options.

    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing data with a 'created_at' column and numeric fields.
    streams : list of str
        List of column names (streams) to plot.
    start_date : str or datetime
        Start datetime (e.g., '2025-03-18 06:54:00').
    end_date : str or datetime
        End datetime (e.g., '2025-03-18 06:59:59').
    style : str, optional
        Style of the plot. Options include:
            - 'default': Standard markers and line style.
            - 'minimal': Clean design with thin black regression line.
            - 'vibrant': Bold markers with a blue dotted regression line.
            - 'dark': Dark background with contrasting markers and lines.
            - 'modern': Sleek markers with gradient-like colors and a solid line.
            - 'pastel': Soft pastel markers with a gentle dashed regression line.
            - 'grayscale': Monochrome markers and regression line.

    Returns:
    --------
    None
        Displays scatter plots for each stream pair with a linear regression line.
    """
    # Define custom style parameters
    styles = {
        'default': {
            'marker': 'o',
            'scatter_alpha': 0.8,
            'reg_color': 'red',
            'reg_linestyle': '--',
            'grid': True,
            'plt_style': None
        },
        'minimal': {
            'marker': 'o',
            'scatter_alpha': 0.7,
            'reg_color': 'black',
            'reg_linestyle': '-',
            'grid': False,
            'plt_style': None
        },
        'vibrant': {
            'marker': 'D',
            'scatter_alpha': 0.9,
            'reg_color': 'blue',
            'reg_linestyle': ':',
            'grid': True,
            'plt_style': None
        },
        'dark': {
            'marker': '^',
            'scatter_alpha': 0.8,
            'reg_color': 'cyan',
            'reg_linestyle': '--',
            'grid': True,
            'plt_style': 'dark_background'
        },
        'modern': {
            'marker': 's',
            'scatter_alpha': 0.85,
            'reg_color': '#2ca02c',  # a green tone
            'reg_linestyle': '-',
            'grid': True,
            'plt_style': 'seaborn-whitegrid'
        },
        'pastel': {
            'marker': 'o',
            'scatter_alpha': 0.9,
            'reg_color': '#ff9999',  # soft pastel red
            'reg_linestyle': '--',
            'grid': True,
            'plt_style': 'seaborn-v0_8-pastel'
        },
        'grayscale': {
            'marker': 'o',
            'scatter_alpha': 0.8,
            'reg_color': 'dimgray',
            'reg_linestyle': '-.',
            'grid': True,
            'plt_style': 'grayscale'
        }
    }

    # Use the specified style or fallback to default
    style_settings = styles.get(style, styles['default'])

    if style_settings['plt_style']:
        plt.style.use(style_settings['plt_style'])
    else:
        plt.style.use('default')

    # Convert 'created_at' to datetime and remove timezone
    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)

    # Filter the DataFrame based on the provided date range
    mask = (df['created_at'] >= pd.to_datetime(start_date)) & (df['created_at'] <= pd.to_datetime(end_date))
    df_filtered = df.loc[mask].copy()

    # Create a new column that floors the timestamp to the minute for grouping
    df_filtered['minute'] = df_filtered['created_at'].dt.floor('min')

    # Group by minute and aggregate the streams (using sum; change to mean() if desired)
    grouped_data = df_filtered.groupby('minute')[streams].sum().reset_index()

    # Create a list of stream pairs (each pair is a tuple (stream1, stream2))
    pairs = list(itertools.combinations(streams, 2))
    n_pairs = len(pairs)

    # Calculate number of rows and columns for subplots
    cols = math.ceil(math.sqrt(n_pairs))
    rows = math.ceil(n_pairs / cols)

    fig, axes = plt.subplots(rows, cols, figsize=(5 * cols, 4 * rows))

    # Flatten axes array for easy iteration (if only one subplot, wrap it in a list)
    if n_pairs == 1:
        axes = [axes]
    else:
        axes = axes.flatten()

    # Create scatter plot and draw linear regression line for each stream pair
    for ax, (stream1, stream2) in zip(axes, pairs):
        x = grouped_data[stream1]
        y = grouped_data[stream2]

        # Scatter plot with chosen style settings
        ax.scatter(x, y, marker=style_settings['marker'], alpha=style_settings['scatter_alpha'])
        ax.set_xlabel(stream1)
        ax.set_ylabel(stream2)
        ax.set_title(f'{stream1} vs {stream2}')

        # Optionally add grid lines
        if style_settings['grid']:
            ax.grid(True)

        # Compute linear regression if there are at least two data points
        if len(x) > 1:
            coeffs = np.polyfit(x, y, deg=1)
            poly = np.poly1d(coeffs)
            x_line = np.linspace(x.min(), x.max(), 100)
            y_line = poly(x_line)
            ax.plot(x_line, y_line, color=style_settings['reg_color'], linestyle=style_settings['reg_linestyle'],
                    label='Linear fit')
            ax.legend()

    # Hide extra subplots if any
    for ax in axes[n_pairs:]:
        ax.remove()

    plt.tight_layout()
    plt.show()
