import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

def compute_window_correlations(
    windows: List[pd.DataFrame],
    method: str = "pearson",
    min_periods: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Computes Pearson (or other) correlation matrix for each pre-created window.
    
    This is a general-purpose function that works with ANY dataset.
    
    Parameters:
    -----------
    windows : List[pd.DataFrame]
        List of DataFrames (each is one sliding window)
    method : str
        Correlation method: 'pearson', 'kendall', 'spearman'
    min_periods : int
        Minimum number of observations required per pair
    
    Returns:
    --------
    List[Dict] where each dict contains:
        - window_index
        - start_time
        - end_time
        - window_size
        - correlation_matrix (pandas DataFrame)
    """
    
    results = []
    
    for idx, window_df in enumerate(windows):
        if len(window_df) < 2:
            continue
            
        # Compute correlation
        corr_matrix = window_df.corr(
            method=method, 
            min_periods=min_periods
        )
        
        result = {
            "window_index": idx,
            "start_time": window_df.index[0] if hasattr(window_df.index, '__len__') and len(window_df.index) > 0 else None,
            "end_time": window_df.index[-1] if hasattr(window_df.index, '__len__') and len(window_df.index) > 0 else None,
            "window_size": len(window_df),
            "correlation_matrix": corr_matrix
        }
        
        results.append(result)
    
    return results


# ===================================================================
#  Test Cell 
# ===================================================================
if __name__ == "__main__":
    print("Testing compute_window_correlations...")
    
    # Create sample data (works with any number of columns)
    np.random.seed(42)
    dates = pd.date_range("2025-04-01", periods=500, freq="S")
    sample_df = pd.DataFrame({
        "sensor_1": np.random.randn(500),
        "sensor_2": np.random.randn(500) * 2 + 5,
        "temperature": np.random.randn(500) + 25,
        "pressure": np.random.randn(500) * 10 + 1013,
    }, index=dates)
    
    # Simulate windows (normally created by another team member)
    windows = [sample_df.iloc[i:i+100] for i in range(0, len(sample_df)-99, 50)]
    
    # Compute correlations
    results = compute_window_correlations(windows, method="pearson")
    
    print(f" Successfully computed {len(results)} correlation matrices")
    print(f"Columns used: {list(windows[0].columns)}")
    
    # Show first matrix
    print("\nFirst window correlation matrix:")
    print(results[0]["correlation_matrix"].round(4))
