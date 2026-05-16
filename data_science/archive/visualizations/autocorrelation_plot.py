import pandas as pd
import matplotlib.pyplot as plt
import math
from pandas.plotting import autocorrelation_plot as pd_autocorrelation_plot


def autocorrelation_plot(df, streams, start_date, end_date, style='default'):
    """
    Create autocorrelation plots for each specified stream over a given time range,
    with a chosen matplotlib style.

    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing data with a 'created_at' column and numeric fields.
    streams : list of str
        List of column names (streams) to plot the autocorrelation for.
    start_date : str or datetime
        Start datetime (e.g., '2025-03-18 06:54:00').
    end_date : str or datetime
        End datetime (e.g., '2025-03-18 06:59:59').
    style : str, optional
        Plot style. Options include:
            - 'default': Standard matplotlib style.
            - 'minimal': Clean, minimal style.
            - 'vibrant': Bold and bright style.
            - 'dark': Dark background.
            - 'modern': Modern ticks style.
            - 'pastel': Soft pastel colors.
            - 'grayscale': Monochrome style.

    Returns:
    --------
    None
        Displays autocorrelation plots for each stream.
    """
    # Define style options
    styles = {
        'default': {'plt_style': None},
        'minimal': {'plt_style': None},
        'vibrant': {'plt_style': None},
        'dark': {'plt_style': 'dark_background'},
        'modern': {'plt_style': 'seaborn-v0_8-ticks'},
        'pastel': {'plt_style': 'seaborn-v0_8-white'},
        'grayscale': {'plt_style': 'grayscale'}
    }

    # Apply the selected style if specified
    style_settings = styles.get(style, styles['default'])
    if style_settings['plt_style']:
        plt.style.use(style_settings['plt_style'])
    else:
        plt.style.use('default')

    # Convert 'created_at' column to datetime and remove timezone if necessary
    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)

    # Filter the DataFrame based on the provided date range
    mask = (df['created_at'] >= pd.to_datetime(start_date)) & (df['created_at'] <= pd.to_datetime(end_date))
    df_filtered = df.loc[mask].copy()

    # Determine grid layout for subplots based on the number of streams
    n_streams = len(streams)
    cols = math.ceil(math.sqrt(n_streams))
    rows = math.ceil(n_streams / cols)

    fig, axes = plt.subplots(rows, cols, figsize=(8 * cols, 4 * rows))

    # Ensure axes is iterable
    if n_streams == 1:
        axes = [axes]
    else:
        axes = axes.flatten()

    # Create an autocorrelation plot for each stream
    for i, stream in enumerate(streams):
        # Set the current axis to the subplot we want to plot on
        plt.sca(axes[i])
        pd_autocorrelation_plot(df_filtered[stream])
        axes[i].set_title(f'Autocorrelation: {stream}')

    # Remove any extra subplots if there are any
    for j in range(i + 1, len(axes)):
        fig.delaxes(axes[j])

    plt.tight_layout()
    plt.show()
