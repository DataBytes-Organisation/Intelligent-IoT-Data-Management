import sys
import pandas as pd

from preprocessor import load_and_prepare
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
from detectors.quantilead import QuantileADDetector
from detectors.levelshiftad import LevelShiftADDetector

from anomaly_injector import inject_all
from evaluator import evaluate


def run_pipeline(filepath, benchmark_mode=False):
    print(f"[pipeline] Loading data from: {filepath}")

    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

    # Inject anomalies
    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {labels.sum()} anomalies")

    # FINAL DETECTORS 
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
        QuantileADDetector(),
    ]

    results = {}

    # Run detectors safely
    for detector in detectors:
        name = type(detector).__name__
        print(f"[pipeline] Running: {name}")
        try:
            results[name] = detector.detect(df)
        except Exception as e:
            print(f"[pipeline] ERROR in {name}: {e}")

    # Print summary
    for name, output in results.items():
        flags = output.get("anomaly_flag")

        if flags is None:
            print(f"\n[pipeline] Skipping {name} (no anomaly_flag)")
            continue

        n_anom = flags.sum()

        print(f"\n[pipeline] {name} results:")
        print(f"  Flagged: {n_anom}/{len(flags)} ({n_anom/len(flags)*100:.1f}%)")

        if "runtime" in output:
            print(f"  Runtime: {output['runtime']:.3f}s")

        score = output.get("score")
        if score is not None and hasattr(score, "nlargest"):
            try:
                print("  Top 5 most anomalous timestamps:")
                print(score.nlargest(5).to_string())
            except Exception:
                print(f"  Could not compute top 5 for {name}")

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

    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    benchmark = "--benchmark" in sys.argv

    run_pipeline(filepath, benchmark_mode=benchmark)
