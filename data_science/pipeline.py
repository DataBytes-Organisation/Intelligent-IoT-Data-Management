import sys
import pandas as pd
from preprocessor import load_and_prepare
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
from anomaly_injector import inject_point_spikes, inject_all
from evaluator import evaluate

def run_pipeline(filepath, benchmark_mode=False):
    print(f"[pipeline] Loading data from: {filepath}")
    df, scaler = load_and_prepare(filepath)
    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

    # Optionally inject synthetic anomalies for scoring
    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")

        # inject all kind of tests
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {labels.sum()} anomalies")


    # DETECTOR
    from detectors.levelshiftad import LevelShiftADDetector  # requires: adtk (pip install adtk)
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
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

    # extract this into report.py
    # prints summary so we see results when pipeline runs
    for name, output in results.items():
        flags = output['anomaly_flag']
        n_anom = flags.sum()
        print(f"\n[pipeline] {output['model_name']} results:")
        print(f"  Flagged: {n_anom}/{len(flags)} ({n_anom/len(flags)*100:.1f}%)")
        if 'score' in output and 'runtime' in output:
            print(f"  Runtime: {output['runtime']:.3f}s")
            print(f"  Top 5 most anomalous timestamps:")
            top5 = output['score'].nlargest(5)
            print(top5.to_string())



    # Score against ground truth if benchmark mode is on
    if benchmark_mode and labels is not None:
        eval_rows = [evaluate(output, labels) for output in results.values()]
        eval_df = pd.DataFrame(eval_rows)
        print("\n[pipeline] Benchmark Results (Precision / Recall / F1):")
        print(eval_df.to_string(index=False))

    return df, scaler, results

if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    benchmark = "--benchmark" in sys.argv
    run_pipeline(filepath, benchmark_mode=benchmark)
