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

    # Load data
    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns: {list(df.columns)}")
    print(f"[pipeline] Preview:\n{df.head()}\n")

    # Inject anomalies (for evaluation)
    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {int(labels.sum())} anomalies")

    # Detectors (NO ECOD HERE)
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
        QuantileADDetector(),
    ]

    results = {}

    # Run detectors
    for detector in detectors:
        name = getattr(detector, "model_name", type(detector).__name__)
        print(f"[pipeline] Running: {name}")

        try:
            output = detector.detect(df)

            # Validate output
            if not isinstance(output, dict):
                raise ValueError(f"{name} did not return dict")

            if "anomaly_flag" not in output:
                raise ValueError(f"{name} missing anomaly_flag")

            results[name] = output

        except Exception as e:
            print(f"[pipeline] ERROR in {name}: {e}")

            if benchmark_mode:
                raise RuntimeError(
                    f"[pipeline] Detector {name} failed during benchmark — fix required"
                )

    # Print summary
    for name, output in results.items():
        flags = output.get("anomaly_flag")
        timestamp = output.get("timestamp")

        if flags is None:
            print(f"\n[pipeline] Skipping {name} (no anomaly_flag)")
            continue

        try:
            flags_series = pd.Series(flags, index=timestamp)
            n_anom = int(flags_series.sum())
            total = len(flags_series)
            pct = (n_anom / total * 100) if total > 0 else 0
        except Exception:
            print(f"[pipeline] Invalid anomaly_flag format for {name}")
            continue

        print(f"\n[pipeline] {name} results:")
        print(f"  Flagged: {n_anom}/{total} ({pct:.1f}%)")

        # Runtime
        if "runtime" in output:
            try:
                print(f"  Runtime: {float(output['runtime']):.3f}s")
            except Exception:
                print("  Runtime: unavailable")

        # Top anomalies
        score = output.get("score")
        if score is not None:
            try:
                score_series = pd.Series(score, index=timestamp)
                print("  Top 5 most anomalous timestamps:")
                print(score_series.nlargest(5))
            except Exception:
                print(f"  Could not compute top 5 for {name}")

    # Evaluation
    if benchmark_mode and labels is not None:
        eval_rows = []

        for name, output in results.items():
            if "anomaly_flag" in output:
                try:
                    row = evaluate(output, labels)
                    row["detector"] = name
                    eval_rows.append(row)
                except Exception as e:
                    print(f"[pipeline] Evaluation failed for {name}: {e}")

        if eval_rows:
            eval_df = pd.DataFrame(eval_rows)
            print("\n[pipeline] Benchmark Results (Precision / Recall / F1):")
            print(eval_df.to_string(index=False))

    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    benchmark = "--benchmark" in sys.argv

    run_pipeline(filepath, benchmark_mode=benchmark)