"""
Anomaly Injector - V1
Injects synthetic point - spike anomalies into clean sensor data
Returns the modified dataset plus ground-truth labels for evaluation
"""

import numpy as np 
import pandas as pd

def inject_point_spikes(
        df: pd.DataFrame,
        n_anomalies: int = 50,
        magnitude: float = 3.0,
        random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Inject point-spike anomalies into a clean DataFrame.

    Parameters
    ----------
    df : DataFrame
        Clean (preprocessed) sensor data
    n_anomalies : int
        Number of rows to corrupt
    magnitude : float
        How extreme the spike is, expressed in standard deviations
        of the corrupted column.
    random_seed : int
        For reproducibility

    Returns
    -------
    df_injected : DataFrame
        Copy of input with anomalies injected
    labels : Series
        Boolean Series, True where an anomaly was injected.
    """

    rng = np.random.default_rng(random_seed)
    df_out = df.copy()
    labels = pd.Series(False, index=df.index, name="is_anomaly")

    # Pick random row positions to corrupt (no duplicates)
    anomaly_positions = rng.choice(len(df), size=n_anomalies, replace=False)

    for pos in anomaly_positions:
        col = rng.choice(df.columns)
        sign = rng.choice([-1, 1])
        df_out.iloc[pos, df.columns.get_loc(col)] += sign * magnitude * df[col].std()
        labels.iloc[pos] = True

    return df_out, labels