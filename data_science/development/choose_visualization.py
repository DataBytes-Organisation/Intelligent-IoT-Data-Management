import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data_science.visualizations.grouped_bar_chart import grouped_bar_chart

def choose_visualization(df, streams, start_date, end_date, type='grouped_bar_chart'):
    if type == 'grouped_bar_chart':
        return grouped_bar_chart(df, streams, start_date, end_date)
    elif type == 'autocorrelation_plot':
        return autocorrelation_plot(df, streams, start_date, end_date, style='default')
    elif type == 'histogram_plots':
        return histogram_plots(df, streams, start_date, end_date, bins=10, style='default')
    elif type == 'table':
        return create_filtered_table(df, streams, start_date, end_date)
    elif type == 'scatter_plot':
        return scatter_plot(df, streams, start_date, end_date, style='default')
    else:
        raise ValueError('Not a valid visualization type')