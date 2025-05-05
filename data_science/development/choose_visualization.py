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
    else:
        raise ValueError('Not a valid visualization type')