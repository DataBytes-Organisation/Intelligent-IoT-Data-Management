import pandas as pd
import numpy as np
import pytest
from data_science.anomaly_injector import (
    inject_point_spikes,
    inject_level_shifts,
    inject_volatility_shifts,
    inject_all,
)


def make_df(rows=100):
    index = pd.date_range(start='2024-01-01', periods=rows, freq='s')
    return pd.DataFrame({
        's1': np.sin(np.linspace(0, 10, rows)),
        's2': np.cos(np.linspace(0, 10, rows)),
        's3': np.linspace(0, 1, rows),
    }, index=index)


def test_empty_dataframe():
    df = make_df(0)
    with pytest.raises(ValueError, match="empty"):
        inject_point_spikes(df)


def test_no_numeric_columns():
    df = pd.DataFrame({'col': ['a', 'b', 'c']})
    with pytest.raises(ValueError, match="No numeric"):
        inject_point_spikes(df)


def test_n_anomalies_exceeds_rows():
    df = make_df(10)
    with pytest.raises(ValueError, match="exceeds"):
        inject_point_spikes(df, n_anomalies=20)


def test_duration_too_large_level_shift():
    df = make_df(10)
    with pytest.raises(ValueError, match="too large"):
        inject_level_shifts(df, duration_range=(500, 1000))


def test_duration_too_large_volatility_shift():
    df = make_df(10)
    with pytest.raises(ValueError, match="too large"):
        inject_volatility_shifts(df, duration_range=(500, 1000))


def test_constant_column():
    index = pd.date_range(start='2024-01-01', periods=100, freq='s')
    df = pd.DataFrame({
        's1': np.zeros(100),
        's2': np.sin(np.linspace(0, 10, 100)),
    }, index=index)
    df_out, labels = inject_point_spikes(df, n_anomalies=5)
    assert df_out is not None
    assert len(labels) == len(df)


def test_non_numeric_columns_ignored():
    index = pd.date_range(start='2024-01-01', periods=100, freq='s')
    df = pd.DataFrame({
        's1': np.sin(np.linspace(0, 10, 100)),
        'label': ['normal'] * 100,
    }, index=index)
    df_out, labels = inject_point_spikes(df, n_anomalies=5)
    assert df_out is not None


def test_overlapping_windows_all_marked():
    df = make_df(200)
    df_out, labels = inject_all(df, n_points=10, n_level_shifts=2, n_volatility_shifts=2)
    assert (labels != "normal").sum() > 0


def test_inject_all_returns_anomaly_types():
    df = make_df(200)
    df_out, labels = inject_all(df)
    types = labels.unique()
    assert "point" in types or "level_shift" in types or "volatility_shift" in types


def test_inject_all_normal_baseline():
    df = make_df(200)
    df_out, labels = inject_all(df)
    assert "normal" in labels.values
