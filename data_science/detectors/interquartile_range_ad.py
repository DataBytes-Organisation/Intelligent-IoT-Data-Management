import pandas as pd


class InterQuartileRangeADDetector:
    """
    Detects anomalies in time-series sensor data using the Interquartile Range (IQR) method.

    The detector calculates Q1, Q3, and IQR for each numeric sensor column.
    Values below Q1 - factor * IQR or above Q3 + factor * IQR are flagged as anomalies.
    """

    def __init__(self, factor=1.5):
        """
        Initialise the InterQuartileRangeAD detector.

        Parameters:
            factor (float): Multiplier for the IQR boundary.
                            Common value is 1.5. Higher values make detection stricter.
        """
        self.model_name = "InterQuartileRangeAD"
        self.factor = factor

    def detect(self, df):
        """
        Detect anomalies across all numeric sensor columns using IQR thresholds.

        Parameters:
            df (pd.DataFrame): Preprocessed time-series dataframe with numeric sensor columns.

        Returns:
            dict: Dictionary containing:
                - anomaly_flag: Boolean Series showing detected anomaly timestamps.
                - score: Series containing combined anomaly scores.
                - model_name: Name of the detector.
                - timestamp: DataFrame index used for detected timestamps.
        """
        combined_flags = pd.Series(False, index=df.index)
        combined_score = pd.Series(0.0, index=df.index)

        for sensor in df.select_dtypes(include="number").columns:
            series = df[sensor].dropna()

            if series.empty:
                continue

            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1

            if iqr == 0:
                continue

            lower_bound = q1 - self.factor * iqr
            upper_bound = q3 + self.factor * iqr

            anomaly_flags = (series < lower_bound) | (series > upper_bound)

            anomaly_score = pd.Series(0.0, index=series.index)
            anomaly_score[series < lower_bound] = lower_bound - series[series < lower_bound]
            anomaly_score[series > upper_bound] = series[series > upper_bound] - upper_bound

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