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
        flags = output['anomaly_flag']
        scores = output['score']
        n_anom = flags.sum()
        print(f"\n[pipeline] {output['model_name']} results:")
        print(f"  Flagged: {n_anom}/{len(flags)} ({n_anom/len(flags)*100:.1f}%)")
        print(f"  Runtime: {output['runtime']:.3f}s")
        print(f"  Top 5 most anomalous timestamps:")
        top5 = scores.nlargest(5)
        print(top5.to_string())


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    run_pipeline(filepath)
