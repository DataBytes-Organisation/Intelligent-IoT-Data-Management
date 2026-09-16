import pandas as pd

from data_science.detectors.iforest_detector import IsolationForestDetector

def run_detector(detector_name, dataframe, parameters=None):

    if parameters is None:
        parameters = {}

    detector_name = detector_name.lower()

    if detector_name == "isolationforest":

        detector = IsolationForestDetector(**parameters)

    else:
        return {
            "status": "failed",
            "error": f"Detector '{detector_name}' is not supported"
        }

    try:

        result = detector.detect(dataframe)

        return {
            "status": "success",
            "model_name": result["model_name"],
            "anomaly_flag": result["anomaly_flag"],
            "score": result["score"],
            "timestamp": result["timestamp"],
            "runtime": result["runtime"]
        }

    except Exception as e:

        return {
            "status": "failed",
            "model_name": detector_name,
            "error": str(e)
        }
