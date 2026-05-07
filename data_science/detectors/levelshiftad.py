import time
import pandas as pd
from adtk.detector import LevelShiftAD as _LevelShiftAD


class LevelShiftADDetector:
    """
    Detects abrupt level shifts in each sensor stream using ADTK.

    Requires: adtk
    window  – number of samples in each comparison window (default 10)
    c       – sensitivity; higher = less sensitive (default 6.0)
    """

    def __init__(self, window=10, c=6.0):
        self.window = window
        self.c = c
        self.name = "LevelShiftADDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Flag rows where any sensor column shows an abrupt level shift.

        Returns
        -------
        dict with keys:
            - anomaly_flag : Series of bool (True = anomaly), indexed like df
            - score        : Series of float (number of columns flagged per row)
            - model_name   : str
            - timestamp    : Index from df
            - runtime      : float (seconds)
        """
        # Cast to DatetimeIndex if not already (ADTK requirement)
        if not isinstance(df.index, pd.DatetimeIndex):
            df = df.copy()
            df.index = pd.to_datetime(df.index)

        df = df.sort_index()
        detector = _LevelShiftAD(c=self.c, window=self.window)

        start = time.time()

        col_flags = {}
        for col in df.columns:
            try:
                anomalies = detector.fit_detect(df[col])
                # dropna required: ADTK inserts NaN at window boundaries which
                # breaks boolean indexing on newer pandas versions
                clean = anomalies.reindex(df.index, fill_value=False)
                clean = clean.fillna(False).astype(bool)
                col_flags[col] = clean
            except Exception:
                col_flags[col] = pd.Series(False, index=df.index)

        runtime = time.time() - start

        flags_df = pd.DataFrame(col_flags)
        anomaly_flag = flags_df.any(axis=1)
        score = flags_df.sum(axis=1).astype(float)

        return {
            "anomaly_flag": anomaly_flag,
            "score":        score,
            "model_name":   self.name,
            "timestamp":    df.index,
            "runtime":      runtime,
        }
