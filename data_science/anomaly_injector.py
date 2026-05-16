"""
Anomaly Injector - V2
Injects synthetic anomalies into clean sensor data
Returns the modified dataset plus ground-truth labels for evaluation
"""

import numpy as np
import pandas as pd


def _validate_df(df: pd.DataFrame) -> None:
    if len(df) == 0:
        raise ValueError("Input DataFrame is empty.")
    if not df.select_dtypes(include=[np.number]).columns.tolist():
        raise ValueError("No numeric columns found in DataFrame.")


def _get_numeric_cols(df: pd.DataFrame) -> list:
    return df.select_dtypes(include=[np.number]).columns.tolist()


def inject_point_spikes(
        df: pd.DataFrame,
        n_anomalies: int = 50,
        magnitude: float = 3.0,
        random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    _validate_df(df)
    numeric_cols = _get_numeric_cols(df)

    if n_anomalies > len(df):
        raise ValueError(f"n_anomalies ({n_anomalies}) exceeds number of rows ({len(df)}).")

    rng = np.random.default_rng(random_seed)
    df_out = df.copy()
    labels = pd.Series("normal", index=df.index, name="anomaly_type")

    anomaly_positions = rng.choice(len(df), size=n_anomalies, replace=False)

    for pos in anomaly_positions:
        col = rng.choice(numeric_cols)
        std = df[col].std()
        if std == 0:
            std = 1.0
        sign = rng.choice([-1, 1])
        df_out.iloc[pos, df.columns.get_loc(col)] += sign * magnitude * std
        labels.iloc[pos] = "point"

    return df_out, labels


def inject_level_shifts(
    df: pd.DataFrame,
    n_anomalies: int = 5,
    duration_range: tuple[int, int] = (18, 40),
    magnitude: float = 2.0,
    random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    _validate_df(df)
    numeric_cols = _get_numeric_cols(df)

    max_duration = min(duration_range[1], len(df))
    min_duration = min(duration_range[0], max_duration)

    if min_duration >= len(df):
        raise ValueError("Duration range is too large for the dataset length.")

    rng = np.random.default_rng(random_seed)
    df_out = df.copy()
    labels = pd.Series("normal", index=df.index, name="anomaly_type")

    for _ in range(n_anomalies):
        col = rng.choice(numeric_cols)
        duration = rng.integers(min_duration, max_duration + 1)
        start = rng.integers(0, len(df) - duration)
        std = df[col].std()
        if std == 0:
            std = 1.0
        sign = rng.choice([-1, 1])
        shift = sign * magnitude * std
        col_idx = df.columns.get_loc(col)
        df_out.iloc[start:start+duration, col_idx] += shift
        labels.iloc[start:start+duration] = "level_shift"

    return df_out, labels


def inject_volatility_shifts(
    df: pd.DataFrame,
    n_anomalies: int = 5,
    duration_range: tuple[int, int] = (20, 50),
    noise_multiplier: float = 5.0,
    random_seed: int = 42,
) -> tuple[pd.DataFrame, pd.Series]:
    _validate_df(df)
    numeric_cols = _get_numeric_cols(df)

    max_duration = min(duration_range[1], len(df))
    min_duration = min(duration_range[0], max_duration)

    if min_duration >= len(df):
        raise ValueError("Duration range is too large for the dataset length.")

    rng = np.random.default_rng(random_seed)
    df_out = df.copy()
    labels = pd.Series("normal", index=df.index, name="anomaly_type")

    for _ in range(n_anomalies):
        col = rng.choice(numeric_cols)
        duration = rng.integers(min_duration, max_duration + 1)
        start = rng.integers(0, len(df) - duration)
        std = df[col].std()
        if std == 0:
            std = 1.0
        noise_scale = noise_multiplier * std
        noise = rng.normal(loc=0, scale=noise_scale, size=duration)
        col_idx = df.columns.get_loc(col)
        df_out.iloc[start:start+duration, col_idx] += noise
        labels.iloc[start:start+duration] = "volatility_shift"

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
    _validate_df(df)

    df_out, labels_pt = inject_point_spikes(
        df, n_anomalies=n_points, random_seed=random_seed
    )
    df_out, labels_lvl = inject_level_shifts(
        df_out, n_anomalies=n_level_shifts, random_seed=random_seed + 1
    )
    df_out, labels_vol = inject_volatility_shifts(
        df_out, n_anomalies=n_volatility_shifts, random_seed=random_seed + 2
    )

    labels = pd.Series("normal", index=df.index, name="anomaly_type")
    labels[labels_pt != "normal"] = labels_pt[labels_pt != "normal"]
    labels[labels_lvl != "normal"] = labels_lvl[labels_lvl != "normal"]
    labels[labels_vol != "normal"] = labels_vol[labels_vol != "normal"]

    return df_out, labels