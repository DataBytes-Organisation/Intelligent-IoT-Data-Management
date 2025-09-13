import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data_science.algorithms.mean_based import mean_based
from data_science.algorithms.volatility_based import volatility_based
from data_science.algorithms.correlation_based import correlation_based

def choose_algorithm(df, streams, start_date, end_date, threshold=None, type='correlation'):
    if type == 'correlation':
        return correlation_based(df, streams, start_date, end_date, threshold)
    elif type == 'mean':
        return mean_based(df, streams, start_date, end_date, threshold)
    elif type == 'volatility':
        return volatility_based(df, streams, start_date, end_date, threshold)
    else:
        raise ValueError('Not a valid choice')