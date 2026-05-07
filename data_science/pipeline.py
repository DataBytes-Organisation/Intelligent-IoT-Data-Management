import sys
import pandas as pd
from pathlib import Path

from preprocessor import load_and_prepare
from detectors.volatility_shift_ad import VolatilityShiftADDetector
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
from detectors.quantilead import QuantileADDetector
from detectors.levelshiftad import LevelShiftADDetector
from detectors.ecod_detector import ECODDetector

from anomaly_injector import inject_all
from evaluator import evaluate
from roc_plotter import plot_roc_curves


def save_benchmark_outputs(eval_df, output_dir="outputs"):
    """
    Save benchmark evaluation results to CSV and JSON files.

    Parameters
    ----------
    eval_df : pd.DataFrame
        DataFrame containing benchmark metrics for each detector.
    output_dir : str
        Directory where output files should be saved.
    """

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    csv_path = output_path / "benchmark_results.csv"
    json_path = output_path / "benchmark_results.json"

    eval_df.to_csv(csv_path, index=False)

    eval_df.to_json(
        json_path,
        orient="records",
        indent=2
    )

    print(f"[pipeline] Saved benchmark CSV to: {csv_path}")
    print(f"[pipeline] Saved benchmark JSON to: {json_path}")


def run_pipeline(filepath, benchmark_mode=False):

    print(f"[pipeline] Loading data from: {filepath}")

    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns: {list(df.columns)}")
    print(f"[pipeline] Preview:\n{df.head()}\n")

    labels = None

    if benchmark_mode:

        print(
            "[pipeline] Benchmark mode ON — "
            "injecting synthetic anomalies"
        )

        df, labels = inject_all(df)

        print(
            f"[pipeline] Injected "
            f"{int((labels != 'normal').sum())} anomalies"
        )

    detectors = [

        PcaADDetector(),

        OCSVMDetector(nu=0.05),

        LevelShiftADDetector(window=10, c=6.0),

        # VolatilityShiftADDetector(),

        QuantileADDetector(),

        ECODDetector(),
    ]

    results = {}

    for detector in detectors:

        name = getattr(
            detector,
            "model_name",
            type(detector).__name__
        )

        print(f"[pipeline] Running: {name}")

        try:

            output = detector.detect(df)

            if not isinstance(output, dict):

                raise ValueError(
                    f"{name} did not return dict"
                )

            if "anomaly_flag" not in output:

                raise ValueError(
                    f"{name} missing anomaly_flag"
                )

            results[name] = output

        except Exception as e:

            print(f"[pipeline] ERROR in {name}: {e}")

            if benchmark_mode:

                raise RuntimeError(
                    f"[pipeline] Detector {name} "
                    f"failed during benchmark — fix required"
                )

    for name, output in results.items():

        flags = output.get("anomaly_flag")
        timestamp = output.get("timestamp")

        if flags is None:

            print(
                f"\n[pipeline] Skipping "
                f"{name} (no anomaly_flag)"
            )

            continue

        if timestamp is None:
            timestamp = df.index

        try:

            if isinstance(flags, pd.Series):

                flags_series = flags

            else:

                flags_series = pd.Series(
                    flags,
                    index=timestamp
                )

            n_anom = int(flags_series.sum())
            total = len(flags_series)

            pct = (
                (n_anom / total * 100)
                if total > 0 else 0
            )

        except Exception:

            print(
                f"[pipeline] Invalid "
                f"anomaly_flag format for {name}"
            )

            continue

        print(f"\n[pipeline] {name} results:")

        print(
            f"  Flagged: "
            f"{n_anom}/{total} ({pct:.1f}%)"
        )

        if "runtime" in output:

            try:

                print(
                    f"  Runtime: "
                    f"{float(output['runtime']):.3f}s"
                )

            except Exception:

                print("  Runtime: unavailable")

        score = output.get("score")

        if score is not None:

            try:

                if isinstance(score, pd.Series):

                    score_series = score

                else:

                    score_series = pd.Series(
                        score,
                        index=timestamp
                    )

                print(
                    "  Top 5 most anomalous timestamps:"
                )

                print(
                    score_series.nlargest(5)
                )

            except Exception:

                print(
                    f"  Could not compute "
                    f"top 5 for {name}"
                )

    # Benchmark evaluation
    if benchmark_mode and labels is not None:

        eval_rows = []

        for name, output in results.items():

            if "anomaly_flag" in output:

                try:

                    row = evaluate(output, labels)

                    row["detector"] = name

                    eval_rows.append(row)

                except Exception as e:

                    print(
                        f"[pipeline] Evaluation failed "
                        f"for {name}: {e}"
                    )

        if eval_rows:

            eval_df = pd.DataFrame(eval_rows)

            # Reorder columns
            eval_df = eval_df[
                [
                    "detector",
                    "precision",
                    "recall",
                    "f1",
                    "auc_roc",
                    "n_predicted",
                    "n_actual",
                ]
            ]

            print(
                "\n[pipeline] Benchmark Results "
                "(Precision / Recall / F1 / ROC-AUC):"
            )

            print(eval_df.to_string(index=False))

            # Save benchmark outputs
            save_benchmark_outputs(eval_df)

            # Keep only detectors with scores
            scored_results = {
                name: output
                for name, output in results.items()
                if output.get("score") is not None
            }

            # Generate ROC curves
            if scored_results:

                plot_roc_curves(
                    scored_results,
                    labels
                )

            else:

                print(
                    "[pipeline] No detectors "
                    "with continuous scores "
                    "available for ROC plotting"
                )

    return df, scaler, results


if __name__ == "__main__":

    filepath = (
        sys.argv[1]
        if (
            len(sys.argv) > 1
            and not sys.argv[1].startswith("--")
        )
        else "datasets/complex.csv"
    )

    benchmark = "--benchmark" in sys.argv

    run_pipeline(
        filepath,
        benchmark_mode=benchmark
    )