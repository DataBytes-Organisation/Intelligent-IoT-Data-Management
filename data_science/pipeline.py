import sys
import pandas as pd

from preprocessor import load_and_prepare
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
from detectors.quantilead import QuantileADDetector
# from detectors.levelshiftad import LevelShiftAD
from anomaly_injector import inject_all
from evaluator import evaluate


def run_pipeline(filepath, benchmark_mode=False):
    print(f"[pipeline] Loading data from: {filepath}")

    df, scaler = load_and_prepare(filepath)
    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

    # Inject anomalies for benchmarking
    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")

        # inject all kind of tests
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {labels.sum()} anomalies")

    # Detectors
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        QuantileADDetector(),
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
        flags = output["anomaly_flag"]
        n_anom = flags.sum()

        print(f"\n[pipeline] {name} results:")
        print(f"  Flagged: {n_anom}/{len(flags)} ({n_anom/len(flags)*100:.1f}%)")

        if "runtime" in output:
            print(f"  Runtime: {output['runtime']:.3f}s")

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

    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    benchmark = "--benchmark" in sys.argv

    run_pipeline(filepath, benchmark_mode=benchmark)