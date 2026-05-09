import time
import pandas as pd


class ThresholdADDetector:
    """
    Detects anomalies using fixed upper and lower thresholds on normalised data.

    Because the pipeline preprocessor applies MinMaxScaler (range [0, 1]),
    default thresholds are set in that normalised space.  Any value above
    `high` or below `low` is flagged as anomalous.

    The anomaly score is the distance beyond the threshold, making it
    directly interpretable on the normalised scale.
    """

    def __init__(self, high=0.95, low=0.05):
        """
        Initialise the ThresholdAD detector.

        Parameters:
            high (float): Upper threshold on the normalised [0, 1] scale.
                          Values above this are flagged as anomalies.
            low  (float): Lower threshold on the normalised [0, 1] scale.
                          Values below this are flagged as anomalies.
        """
        if high <= low:
            raise ValueError(
                f"high ({high}) must be greater than low ({low})."
            )
        self.high = high
        self.low = low
        self.model_name = "ThresholdADDetector"

    def detect(self, df: pd.DataFrame) -> dict:
        """
        Detect anomalies across all numeric sensor columns using fixed thresholds.

        Parameters:
            df (pd.DataFrame): Preprocessed (MinMax-normalised) time-series
                               dataframe with numeric sensor columns.

        Returns:
            dict: Dictionary containing:
                - model_name: Name of the detector.
                - timestamp:  DataFrame index.
                - anomaly_flag: Boolean Series – True where any sensor exceeds
                                the threshold.
                - score: Float Series – combined distance beyond thresholds.
                - runtime: Wall-clock time in seconds.
        """
        start_time = time.time()

        # Input validation
        if df is None or df.shape[1] == 0:
            raise ValueError("Input DataFrame must contain at least one column.")

        df_numeric = df.select_dtypes(include=["number"])
        if df_numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for ThresholdAD.")

        combined_flags = pd.Series(False, index=df.index)
        combined_score = pd.Series(0.0, index=df.index)

        for sensor in df_numeric.columns:
            series = df_numeric[sensor].fillna(0)

            # Flag values outside thresholds
            above = series > self.high
            below = series < self.low
            anomaly_flags = above | below

            # Score: distance beyond the nearest threshold
            score = pd.Series(0.0, index=series.index)
            score[above] = series[above] - self.high
            score[below] = self.low - series[below]

            # Combine across sensors (OR for flags, max for scores)
            combined_flags = combined_flags | anomaly_flags
            combined_score = pd.concat(
                [combined_score, score], axis=1
            ).max(axis=1)

        runtime = time.time() - start_time

        return {
            "model_name": self.model_name,
            "timestamp": df.index,
            "anomaly_flag": combined_flags,
            "score": combined_score,
            "runtime": runtime,
        }
