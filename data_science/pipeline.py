import sys
from preprocessor import load_and_prepare
from detectors.volatility_shift_ad import VolatilityShiftADDetector

def run_pipeline(filepath):
    print(f"[pipeline] Loading data from: {filepath}")
    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

    #  DETECTOR
    detectors = [
		VolatilityShiftADDetector()
	]
    # Link the detectors we implement below so others can draw on them if need be.
    # if theres any requirements for your detector maybe note it here as well.
    

    results = {}
    for detector in detectors:
        name = type(detector).__name__
        print(f"[pipeline] Running: {name}")
        results[name] = detector.detect(df)

        print(results[name].head())
        print(results[name]["anomaly_flag"].value_counts(dropna=False))

	
    if not detectors:
        print("[pipeline] preprocessing works")

    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    run_pipeline(filepath)
