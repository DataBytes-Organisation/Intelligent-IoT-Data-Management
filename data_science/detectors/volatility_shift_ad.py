import pandas as pd
from adtk.data import validate_series
from adtk.detector import VolatilityShiftAD


class VolatilityShiftADDetector:
    """
    Detects volatility/variance changes in time-series sensor data using ADTK's
    VolatilityShiftAD detector.

    This detector is useful for identifying jitter, instability, or sudden changes
    in signal variation rather than only detecting value spikes.
    """

    def __init__(self, c=6.0, window=10, side="both"):
        """
        Initialise the VolatilityShiftAD detector.

        Parameters:
            c (float): Sensitivity threshold. Higher values make detection stricter.
            window (int): Rolling window size used to calculate volatility.
            side (str): Direction of volatility change to detect. Options include
                        "both", "positive", or "negative".
        """

        self.model_name = "VolatilityShiftAD"
        self.c = c
        self.window = window
        self.side = side

    def detect(self, df):
        """
        Detect volatility shifts across all numeric sensor columns.

        Parameters:
            df (pd.DataFrame): Preprocessed time-series dataframe with a DatetimeIndex
                               and numeric sensor columns.

        Returns:
            dict: Dictionary containing:
                - anomaly_flag: Boolean Series showing detected anomaly timestamps.
                - score: Series containing combined volatility scores.
                - model_name: Name of the detector.
                - timestamp: DataFrame index used for detected timestamps.
        """

        df = df.copy()

        combined_flags = pd.Series(False, index=df.index)
        combined_score = pd.Series(0.0, index=df.index)

        for sensor in df.select_dtypes(include="number").columns:
            series = df[sensor].dropna()

            if series.empty:
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

            combined_flags.loc[anomaly_flags.index] = (
                combined_flags.loc[anomaly_flags.index] | anomaly_flags
            )

            combined_score = pd.concat(
                [combined_score, anomaly_score],
                axis=1
            ).max(axis=1)

        return {
            "anomaly_flag": combined_flags,
            "score": combined_score,
            "model_name": self.model_name,
            "timestamp": df.index
        }