import sys
from preprocessor import load_and_prepare
from detectors.ocsvm_detector import OCSVMDetector

def run_pipeline(filepath):
    print(f"[pipeline] Loading data from: {filepath}")
    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

    #  DETECTOR
    detectors = [
        OCSVMDetector(nu=0.05),
    ]
    # Link the detectors we implement below so others can draw on them if need be.
    # if theres any requirements for your detector maybe note it here as well.
    

    results = {}
    for detector in detectors:
        name = type(detector).__name__
        print(f"[pipeline] Running: {name}")
        results[name] = detector.detect(df)

    if not detectors:
        print("[pipeline] preprocessing works")

    # TODO: extract this into a proper Report Output component (report.py)
    # For now, prints a basic summary so users see results when running the pipeline.
    for name, output in results.items():
        n_anom = output['is_anomaly'].sum()
        runtime = output['runtime'].dropna().iloc[0]
        print(f"\n[pipeline] {name} results:")
        print(f"  Flagged: {n_anom}/{len(output)} ({n_anom/len(output)*100:.1f}%)")
        print(f"  Runtime: {runtime:.3f}s")
        print(f"  Top 5 most anomalous timestamps:")
        print(output.nlargest(5, 'score')[['timestamp', 'score']].to_string(index=False))

    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    run_pipeline(filepath)
