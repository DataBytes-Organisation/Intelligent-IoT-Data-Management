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


def inject_level_shifts(
    df: pd.DataFrame,
    n_anomalies: int = 5,
    duration_range: tuple[int, int] = (18, 40),
    magnitude: float = 2.0,
    random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Inject level-shift anomalies — sustained baseline changes lasting
    multiple consecutive rows.

    Parameters
    ----------
    n_anomalies : int
        Number of separate level-shift events to inject.
    duration_range : (int, int)
        Min and max length of each level shift, in rows.
    magnitude : float
        Size of the shift, in standard deviations of the column.
    """
    rng = np.random.default_rng(random_seed)
    df_out = df.copy()
    labels = pd.Series(False, index=df.index, name="is_anomaly")

    for _ in range(n_anomalies):
        col = rng.choice(df.columns)
        duration = rng.integers(duration_range[0], duration_range[1] + 1)
        # Pick a start position that won't overshoot the end
        start = rng.integers(0, len(df) - duration)
        sign = rng.choice([-1, 1])

        shift = sign * magnitude * df[col].std()
        col_idx = df.columns.get_loc(col)

        df_out.iloc[start:start+duration, col_idx] += shift
        labels.iloc[start:start+duration] = True

    return df_out, labels


def inject_volatility_shifts(
    df: pd.DataFrame,
    n_anomalies: int = 5,
    duration_range: tuple[int, int] = (20, 50),
    noise_multiplier: float = 5.0,
    random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Inject volatility-shift anomalies — periods where the sensor's noise
    level dramatically increases while the mean stays roughly the same.

    Parameters
    ----------
    n_anomalies : int
        Number of separate volatility-shift events to inject.
    duration_range : (int, int)
        Min and max length of each event, in rows.
    noise_multiplier : float
        How much louder the noise gets during the event (multiplied by
        the column's natural std).
    """
    rng = np.random.default_rng(random_seed)
    df_out = df.copy()
    labels = pd.Series(False, index=df.index, name="is_anomaly")

    for _ in range(n_anomalies):
        col = rng.choice(df.columns)
        duration = rng.integers(duration_range[0], duration_range[1] + 1)
        start = rng.integers(0, len(df) - duration)

        noise_scale = noise_multiplier * df[col].std()
        noise = rng.normal(loc=0, scale=noise_scale, size=duration)
        col_idx = df.columns.get_loc(col)

        df_out.iloc[start:start+duration, col_idx] += noise
        labels.iloc[start:start+duration] = True

    return df_out, labels


def inject_all(
    df: pd.DataFrame,
    n_points: int = 20,
    n_level_shifts: int = 1,
    n_volatility_shifts: int = 1,
    random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Inject all three anomaly types into the same dataset.
    Useful for benchmarking detectors against a realistic mix.
    """
    df_out, labels_pt = inject_point_spikes(
        df, n_anomalies=n_points, random_seed=random_seed
    )
    df_out, labels_lvl = inject_level_shifts(
        df_out, n_anomalies=n_level_shifts, random_seed=random_seed + 1
    )
    df_out, labels_vol = inject_volatility_shifts(
        df_out, n_anomalies=n_volatility_shifts, random_seed=random_seed + 2
    )

    # Union the labels — any row marked by any function is anomalous
    labels = labels_pt | labels_lvl | labels_vol
    labels.name = "is_anomaly"

    return df_out, labels