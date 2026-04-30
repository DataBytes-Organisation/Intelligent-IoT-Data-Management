import pandas as pd
from adtk.data import validate_series
from adtk.detector import VolatilityShiftAD


class VolatilityShiftADDetector:
    def __init__(self, c=6.0, window=10, side="both"):
        self.model_name = "VolatilityShiftAD"
        self.c = c
        self.window = window
        self.side = side

    def detect(self, df):
        df = df.copy()

        if not isinstance(df.index, pd.DatetimeIndex):
            df.index = pd.date_range(
                start="2026-01-01",
                periods=len(df),
                freq="s"
            )

        df.columns = df.columns.str.strip()

        combined_flags = pd.Series(False, index=df.index)
        combined_score = pd.Series(0.0, index=df.index)

        print(f"\n[pipeline] {self.model_name} results:")

        for sensor in df.select_dtypes(include="number").columns:
            series = df[sensor].dropna()

            if series.empty:
                print(f"  [{sensor}]: 0 volatility shift(s) detected")
                continue

            series = validate_series(series)

            detector = VolatilityShiftAD(
                c=self.c,
                window=self.window,
                side=self.side
            )

            anomaly_flags = detector.fit_detect(series)
            anomaly_flags = anomaly_flags.fillna(False).astype(bool)

            anomaly_score = series.rolling(window=self.window).std().fillna(0)

            detected_times = anomaly_flags[anomaly_flags == True].index

            print(f"  [{sensor}]: {len(detected_times)} volatility shift(s) detected")

            for ts in detected_times:
                print(f"      - {ts}")

            combined_flags.loc[anomaly_flags.index] = (
                combined_flags.loc[anomaly_flags.index] | anomaly_flags
            )

            combined_score.loc[anomaly_score.index] = pd.concat(
                [
                    combined_score.loc[anomaly_score.index],
                    anomaly_score
                ],
                axis=1
            ).max(axis=1)

        return {
            "anomaly_flag": combined_flags,
            "score": combined_score,
            "model_name": self.model_name,
            "timestamp": df.index
        }