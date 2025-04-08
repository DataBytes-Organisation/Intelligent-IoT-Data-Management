#!/usr/bin/env python
# coding: utf-8

# In[31]:


"""
time_series_analyzer.py
A module for analyzing time series data correlations and outliers.
"""

import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from scipy import stats

def calculate_correlations(df):
    """
    Calculate correlation matrix for numeric columns in the DataFrame.
    
    Args:
        df (pd.DataFrame): Input time series data with numeric columns
        
    Returns:
        pd.DataFrame: Correlation matrix
    """
    return df.corr()

def detect_outliers(df, method='zscore', threshold=3):
    """
    Detect outliers in time series data using specified method.
    
    Args:
        df (pd.DataFrame): Input time series data
        method (str): 'zscore' or 'iqr'
        threshold (float): Detection sensitivity
        
    Returns:
        dict: Outlier indices per column {column: [indices]}
    """
    outliers = {}
    
    for col in df.columns:
        if method == 'zscore':
            z_scores = np.abs(stats.zscore(df[col]))
            outliers[col] = np.where(z_scores > threshold)[0]
        elif method == 'iqr':
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            outliers[col] = df[(df[col] < (q1 - 1.5 * iqr)) | 
                              (df[col] > (q3 + 1.5 * iqr))].index.tolist()
    return outliers

def plot_correlation_heatmap(corr_matrix, figsize=(10, 8)):
    """
    Plot correlation matrix as heatmap.
    
    Args:
        corr_matrix (pd.DataFrame): Correlation matrix
        figsize (tuple): Figure dimensions
    """
    plt.figure(figsize=figsize)
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', 
                fmt='.2f', linewidths=0.5)
    plt.title("Correlation Heatmap")
    plt.show()

def plot_time_series(df, outliers=None, figsize=(12, 6)):
    """
    Plot time series data with optional outlier highlighting.
    
    Args:
        df (pd.DataFrame): Time series data
        outliers (dict): Outlier indices from detect_outliers()
        figsize (tuple): Figure dimensions
    """
    plt.figure(figsize=figsize)
    
    for col in df.columns:
        # Plot main series
        plt.plot(df.index, df[col], label=col, alpha=0.7)
        
        # Highlight outliers if provided
        if outliers and col in outliers:
            outlier_idx = outliers[col]
            plt.scatter(df.index[outlier_idx], df[col].iloc[outlier_idx],
                        color='red', marker='o', s=50,
                        label=f'{col} Outliers', zorder=3)
    
    plt.title("Time Series with Correlations")
    plt.xlabel("Time")
    plt.ylabel("Value")
    plt.legend(loc='upper left', bbox_to_anchor=(1, 1))
    plt.tight_layout()
    plt.show()

def analyze_time_series(df, outlier_method='zscore', outlier_threshold=3):
    """
    Main analysis function combining correlation and outlier analysis.
    
    Args:
        df (pd.DataFrame): Input time series data
        outlier_method (str): Outlier detection method
        outlier_threshold (float): Outlier detection sensitivity
    """
    # Correlation analysis
    corr_matrix = calculate_correlations(df)
    plot_correlation_heatmap(corr_matrix)
    
    # Outlier detection
    outliers = detect_outliers(df, method=outlier_method, 
                              threshold=outlier_threshold)
    
    # Time series visualization with outliers
    plot_time_series(df, outliers=outliers)

