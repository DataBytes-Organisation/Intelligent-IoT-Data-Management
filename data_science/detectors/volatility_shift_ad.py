import pandas as pd
import numpy as np
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

        self.model_name = "VolatilityShiftADDetector"
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

        combined_flags_arr = np.zeros(len(df), dtype=bool)
        combined_score_arr = np.zeros(len(df), dtype=float)

        for sensor in df.select_dtypes(include="number").columns:
            series = df[sensor]
            
            if series.empty:
                continue

            try:
                # ADTK usually requires valid time-series index
                series = validate_series(series)

                detector = VolatilityShiftAD(
                    c=self.c,
                    window=self.window,
                    side=self.side
                )

                # adtk returns a Series with NaNs at the beginning
                anomaly_flags = detector.fit_detect(series)
                # Fill NaNs and ensure it's bool
                anomaly_flags = anomaly_flags.fillna(False).astype(bool)
                # Align with original df index
                anomaly_flags = anomaly_flags.reindex(df.index, fill_value=False)
                
                combined_flags_arr = combined_flags_arr | anomaly_flags.values
                
                # Score: rolling standard deviation is a good proxy for volatility
                anomaly_score = series.rolling(window=self.window).std().fillna(0).reindex(df.index, fill_value=0.0)
                combined_score_arr = np.maximum(combined_score_arr, anomaly_score.values)
                
            except Exception as e:
                # If one sensor fails, log it but continue with others
                print(f"[VolatilityShiftADDetector] Warning: failed on {sensor}: {e}")

        return {
            "anomaly_flag": pd.Series(combined_flags_arr, index=df.index),
            "score": pd.Series(combined_score_arr, index=df.index),
            "model_name": self.model_name,
            "timestamp": df.index
        }