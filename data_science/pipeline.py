import sys
import pandas as pd

from preprocessor import load_and_prepare
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
<<<<<<< HEAD
from detectors.quantilead import QuantileADDetector
<<<<<<< HEAD
# from detectors.levelshiftad import LevelShiftAD
=======
from detectors.levelshiftad import LevelShiftADDetector

>>>>>>> main
from anomaly_injector import inject_all
=======
from anomaly_injector import inject_point_spikes, inject_all
>>>>>>> upstream/main
from evaluator import evaluate


def run_pipeline(filepath, benchmark_mode=False):
    print(f"[pipeline] Loading data from: {filepath}")

    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

<<<<<<< HEAD
    # Inject anomalies for benchmarking
=======
    # Inject anomalies
>>>>>>> main
    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {labels.sum()} anomalies")

<<<<<<< HEAD
<<<<<<< HEAD
    # Detectors
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        QuantileADDetector(),
=======
    # FINAL DETECTORS 
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
        QuantileADDetector(),    
>>>>>>> main
=======

    # DETECTOR
    from detectors.levelshiftad import LevelShiftADDetector  # requires: adtk (pip install adtk)
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
>>>>>>> upstream/main
    ]

    results = {}

    # Run detectors
    for detector in detectors:
        name = type(detector).__name__
        print(f"[pipeline] Running: {name}")
        output = detector.detect(df)
        results[name] = output

    # Print summary
    for name, output in results.items():
<<<<<<< HEAD
        flags = output["anomaly_flag"]
=======
        flags = output.get("anomaly_flag")

        # skip incompatible detectors
        if flags is None:
            print(f"\n[pipeline] Skipping {name} (no anomaly_flag)")
            continue

>>>>>>> main
        n_anom = flags.sum()

        print(f"\n[pipeline] {name} results:")
        print(f"  Flagged: {n_anom}/{len(flags)} ({n_anom/len(flags)*100:.1f}%)")

        if "runtime" in output:
            print(f"  Runtime: {output['runtime']:.3f}s")

<<<<<<< HEAD
        if "score" in output and hasattr(output["score"], "nunique") and output["score"].nunique() > 2:
            print("  Top 5 most anomalous timestamps:")
            try:
                top5 = output["score"].nlargest(5)
                print(top5.to_string())
            except Exception:
                print("  Score not suitable for ranking")

    # Evaluate
    if benchmark_mode and labels is not None:
        eval_rows = [evaluate(output, labels) for output in results.values()]
        eval_df = pd.DataFrame(eval_rows)

        print("\n[pipeline] Benchmark Results (Precision / Recall / F1):")
        print(eval_df.to_string(index=False))
=======
        if "score" in output:
            try:
                print("  Top 5 most anomalous timestamps:")
                top5 = output["score"].nlargest(5)
                print(top5.to_string())
            except:
                pass

    # Evaluation
    if benchmark_mode and labels is not None:
        eval_rows = []

        for output in results.values():
            if "anomaly_flag" in output:
                eval_rows.append(evaluate(output, labels))

        if eval_rows:
            eval_df = pd.DataFrame(eval_rows)
            print("\n[pipeline] Benchmark Results (Precision / Recall / F1):")
            print(eval_df.to_string(index=False))
>>>>>>> main

    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    benchmark = "--benchmark" in sys.argv
<<<<<<< HEAD

    run_pipeline(filepath, benchmark_mode=benchmark)
=======
    run_pipeline(filepath, benchmark_mode=benchmark)
>>>>>>> upstream/main
