from adtk.detector import PcaAD
import pandas as pd
class PcaADDetector:
    """
    Detects anomalys outside the sensors normal pattern
    """

    def __init__(self):
        self.detector = PcaAD(k=1)
        self.name = "PcaAD"

    def detect(self, df):
        """
        Parameters:
            df: gets normalised by preprocessor, s1, s2, s3, datetimeindex

        result:
            creates a dictionary in form anomaly_flag, model, time
        """
        anomalies = self.detector.fit_detect(df)
        anomalies = anomalies.dropna()

        return {
            "anomaly_flag": anomalies.astype(bool),
            "model_name": self.name,
            "timestamp": anomalies.index,
        }
