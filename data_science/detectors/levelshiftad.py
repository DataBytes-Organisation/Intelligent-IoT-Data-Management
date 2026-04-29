import pandas as pd
from adtk.detector import LevelShiftAD as _LevelShiftAD


class LevelShiftAD:
    """
    Detects abrupt level shifts in each sensor stream using ADTK.

    Requires: adtk
    window  – number of samples in each comparison window (default 10)
    c       – sensitivity; higher = less sensitive (default 6.0)
    """

    def __init__(self, window=10, c=6.0):
        self.window = window
        self.c = c

    def detect(self, df):
        # Cast to DatetimeIndex if not already (ADTK requirement)
        if not isinstance(df.index, pd.DatetimeIndex):
            df = df.copy()
            df.index = pd.to_datetime(df.index)

        df = df.sort_index()

        detector = _LevelShiftAD(c=self.c, window=self.window)

        results = {}
        for col in df.columns:
            series = df[col]
            try:
                anomalies = detector.fit_detect(series)
                # dropna required: ADTK inserts NaN at window boundaries which
                # breaks boolean indexing on newer pandas versions
                clean = anomalies.dropna().astype(bool)
                flagged = clean[clean].index.tolist()
                results[col] = {"anomalies": flagged, "count": len(flagged)}
                print(f"  [{col.strip()}]: {len(flagged)} level shift(s) detected")
                for ts in flagged:
                    print(f"    - {ts}")
            except Exception as e:
                print(f"  [{col}] Error: {e}")
                results[col] = {"anomalies": [], "count": 0}

        return results
