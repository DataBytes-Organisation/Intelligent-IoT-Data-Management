"""
pipeline_demo.py (Week 5)
Integration demo: validator -> detector runner -> standard JSON output.

Proves the shared Week 5 workflow connects end to end using:
  - input_validator.py (mine, finalized v2 this week)
  - a REAL existing detector (ThresholdADDetector, from detectors/thresholdad.py)
  - a TEMPORARY run_detector() entry point and TEMPORARY output formatter,
    standing in for Pradeep's detector runner and Saran's JSON adapter (both
    still in progress as of this PR). Replace these two temporary pieces once
    their real implementations merge -- flagged clearly below and in the PR.

Owner: Deepakkumar Govindan
"""
import json
import pandas as pd
from input_validator import validate_input, InputValidationError
from detectors.thresholdad import ThresholdADDetector

# TEMPORARY registry -- Pradeep's real detector runner will replace this.
AVAILABLE_DETECTORS = {
    "ThresholdAD": ThresholdADDetector,
}


def run_detector(detector_name, data, parameters=None):
    """TEMPORARY stable entry point -- placeholder for Pradeep's real detector runner."""
    parameters = parameters or {}
    if detector_name not in AVAILABLE_DETECTORS:
        raise ValueError(
            f"Unknown detector '{detector_name}'. Available: {list(AVAILABLE_DETECTORS.keys())}"
        )
    detector = AVAILABLE_DETECTORS[detector_name](**parameters)
    return detector.detect(data)


def format_standard_output(raw_result, original_df, sensor_id=None, parameters=None):
    """TEMPORARY output formatter -- placeholder for Saran's real JSON adapter."""
    parameters = parameters or {}
    records = []
    for ts in raw_result["timestamp"]:
        flag = int(raw_result["anomaly_flag"].loc[ts])
        score = float(raw_result["score"].loc[ts])
        sensor_values = original_df.loc[ts].to_dict()
        records.append({
            "detection_time": str(ts),
            "sensor_id": sensor_id,
            "model_name": raw_result["model_name"],
            "anomaly_flag": flag,
            "anomaly_score": round(score, 4),
            "sensor_value": sensor_values,
            "runtime": round(raw_result["runtime"], 6),
            "parameters": parameters,
        })
    return records


if __name__ == "__main__":
    print("=== Step 1: load + validate real sensor data ===")
    df = pd.read_csv("datasets/complex.csv")
    df.columns = df.columns.str.strip()
    validated = validate_input(
        df,
        timestamp_col="time",
        sensor_id="demo_sensor_01",
        timestamp_is_index=True,
        min_rows=10,
    )
    sensor_only = validated.drop(columns=["sensor_id"])
    print(f"Validated {len(validated)} rows, columns: {list(sensor_only.columns)}")
    print("PASSED\n")

    print("=== Step 2: run a real detector through the entry point ===")
    result = run_detector("ThresholdAD", sensor_only, parameters={"threshold": 3.0})
    print(f"Detector '{result['model_name']}' ran successfully.")
    print(f"Anomalies flagged: {int(result['anomaly_flag'].sum())} / {len(result['anomaly_flag'])}")
    print("PASSED\n")

    print("=== Step 3: format into standard Models JSON output ===")
    formatted = format_standard_output(
        result, sensor_only, sensor_id="demo_sensor_01", parameters={"threshold": 3.0}
    )

    normal_example = next(r for r in formatted if r["anomaly_flag"] == 0)
    anomaly_example = next((r for r in formatted if r["anomaly_flag"] == 1), None)

    print("Normal example:")
    print(json.dumps(normal_example, indent=2))
    print()
    if anomaly_example:
        print("Anomaly example:")
        print(json.dumps(anomaly_example, indent=2))
    else:
        print("No anomalies flagged in this sample at threshold=3.0.")
    print("PASSED\n")

    print("=== Step 4: failure case -- unknown detector name ===")
    try:
        run_detector("NotARealDetector", sensor_only)
        print("FAILED -- should have raised ValueError")
    except ValueError as e:
        print(f"REJECTED correctly: {e}\n")

    print("=== Step 5: failure case -- empty data ===")
    try:
        validate_input(pd.DataFrame(), timestamp_col="time")
        print("FAILED -- should have raised InputValidationError")
    except InputValidationError as e:
        print(f"REJECTED correctly: {e}")
