import sys
<<<<<<< Updated upstream
=======
import pandas as pd

>>>>>>> Stashed changes
from preprocessor import load_and_prepare
from detectors.volatility_shift_ad import VolatilityShiftADDetector
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
<<<<<<< Updated upstream
from detectors.levelshiftad import LevelShiftAD

def run_pipeline(filepath):
=======
from detectors.quantilead import QuantileADDetector
from detectors.levelshiftad import LevelShiftADDetector

from anomaly_injector import inject_all
from evaluator import evaluate


def run_pipeline(filepath, benchmark_mode=False):
>>>>>>> Stashed changes
    print(f"[pipeline] Loading data from: {filepath}")

<<<<<<< Updated upstream
    # DETECTOR
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftAD(),
=======
    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns: {list(df.columns)}")
    print(f"[pipeline] Preview:\n{df.head()}\n")

    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {int(labels.sum())} anomalies")

    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
        VolatilityShiftADDetector(),
        QuantileADDetector(),
>>>>>>> Stashed changes
    ]

    results = {}

    for detector in detectors:
        name = getattr(detector, "model_name", type(detector).__name__)
        print(f"[pipeline] Running: {name}")

        try:
            output = detector.detect(df)

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

    for name, output in results.items():
        flags = output.get("anomaly_flag")
        timestamp = output.get("timestamp")

<<<<<<< Updated upstream
=======
        if flags is None:
            print(f"\n[pipeline] Skipping {name} (no anomaly_flag)")
            continue

        if timestamp is None:
            timestamp = df.index

        try:
            if isinstance(flags, pd.Series):
                flags_series = flags
            else:
                flags_series = pd.Series(flags, index=timestamp)

            n_anom = int(flags_series.sum())
            total = len(flags_series)
            pct = (n_anom / total * 100) if total > 0 else 0

        except Exception:
            print(f"[pipeline] Invalid anomaly_flag format for {name}")
            continue

        print(f"\n[pipeline] {name} results:")
        print(f"  Flagged: {n_anom}/{total} ({pct:.1f}%)")

        if "runtime" in output:
            try:
                print(f"  Runtime: {float(output['runtime']):.3f}s")
            except Exception:
                print("  Runtime: unavailable")

        score = output.get("score")

        if score is not None:
            try:
                if isinstance(score, pd.Series):
                    score_series = score
                else:
                    score_series = pd.Series(score, index=timestamp)

                print("  Top 5 most anomalous timestamps:")
                print(score_series.nlargest(5))

            except Exception:
                print(f"  Could not compute top 5 for {name}")

    if benchmark_mode and labels is not None:
        eval_rows = [evaluate(output, labels) for output in results.values()]
        eval_df = pd.DataFrame(eval_rows)
        print("\n[pipeline] Benchmark Results (Precision / Recall / F1):")
        print(eval_df.to_string(index=False))
        eval_df.to_csv("generalisation_results.csv", index=False)
        print("[pipeline] Results saved to generalisation_results.csv")

>>>>>>> Stashed changes
    return df, scaler, results


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    run_pipeline(filepath)