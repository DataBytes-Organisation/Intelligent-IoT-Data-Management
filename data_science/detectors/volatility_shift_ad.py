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
        results = []

        df = df.copy()
        if not isinstance(df.index, pd.DatetimeIndex):
            df.index = pd.date_range(
                start="2026-01-01",
                periods=len(df),
                freq="s"
            )

        df.columns = df.columns.str.strip()

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

            sensor_result = pd.DataFrame({
                "model_name": self.model_name,
                "sensor": sensor,
                "timestamp": series.index,
                "anomaly_flag": anomaly_flags.values,
                "anomaly_score": anomaly_score.values
            })

            results.append(sensor_result)

        if results:
            return pd.concat(results, ignore_index=True)

        return pd.DataFrame(
            columns=["model_name", "sensor", "timestamp", "anomaly_flag", "anomaly_score"]
        )