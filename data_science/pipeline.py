import argparse
import sys
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler

from preprocessor import load_and_prepare
from detectors.volatility_shift_ad import VolatilityShiftADDetector
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
from detectors.quantilead import QuantileADDetector
from detectors.levelshiftad import LevelShiftADDetector
from detectors.ecod_detector import ECODDetector
from detectors.interquartile_range_ad import InterQuartileRangeADDetector
from detectors.copod_detector import COPODDetector

from anomaly_injector import inject_all
from evaluator import evaluate
from roc_plotter import plot_roc_curves
from nab_loader import load_nab_labels

def build_detectors():
    return [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        LevelShiftADDetector(window=10, c=6.0),
        VolatilityShiftADDetector(),
        QuantileADDetector(),
        ECODDetector(),
        COPODDetector(),
        InterQuartileRangeADDetector(),
    ]


def save_benchmark_outputs(eval_df, output_dir="outputs"):
    """
    Save benchmark evaluation results to CSV and JSON files.
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


def time_train_test_split(df, train_ratio=0.7):
    if df.empty:
        raise ValueError("Cannot split an empty dataframe.")

    if not 0 < train_ratio < 1:
        raise ValueError("train_ratio must be between 0 and 1.")

    split_idx = int(len(df) * train_ratio)

    if split_idx == 0 or split_idx == len(df):
        raise ValueError("Train/test split produced an empty train or test set.")

    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    return train_df, test_df


def scale_train_test(train_df, test_df):
    numeric_cols = train_df.select_dtypes(include="number").columns.tolist()

    if not numeric_cols:
        raise ValueError("No numeric columns found for scaling.")

    scaler = MinMaxScaler()

    train_scaled = pd.DataFrame(
        scaler.fit_transform(train_df[numeric_cols]),
        columns=numeric_cols,
        index=train_df.index,
    )

    test_scaled = pd.DataFrame(
        scaler.transform(test_df[numeric_cols]),
        columns=numeric_cols,
        index=test_df.index,
    )

    return train_scaled, test_scaled, scaler


def fit_trainable_detectors(detectors, train_df):
    for detector in detectors:
        fit_attr = getattr(detector, "fit", None)
        if callable(fit_attr):
            print(f"[pipeline] Fitting {detector.__class__.__name__} on training data...")
            fit_attr(train_df)

    return detectors


def split_features_and_labels(df, label_col="is_anomaly"):
    if label_col not in df.columns:
        raise ValueError(f"Expected label column '{label_col}' not found in dataframe.")

    raw_labels = df[label_col]

    if raw_labels.dtype == bool:
        labels = raw_labels
    else:
        labels = raw_labels != "normal"

    features = df.drop(columns=[label_col])

    return features, labels


def run_pipeline(
    filepath,
    benchmark_mode=False,
    label_source="synthetic",
    nab_label_file=None,
    nab_dataset_key=None,
):

    print(f"[pipeline] Loading data from: {filepath}")

    df, scaler = load_and_prepare(filepath)

    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns: {list(df.columns)}")
    print(f"[pipeline] Preview:\n{df.head()}\n")

    labels = None

    if benchmark_mode:
        if label_source == "synthetic":
            print("[pipeline] Benchmark mode ON - injecting synthetic anomalies")
            df, labels = inject_all(df)

            try:
                n_injected = int((labels != "normal").sum())
            except Exception:
                n_injected = int(labels.sum())

            print(f"[pipeline] Injected {n_injected} anomalies")

        elif label_source == "nab":
            if not nab_label_file or not nab_dataset_key:
                raise ValueError(
                    "NAB benchmark requires both --nab-label-file and --nab-dataset-key."
                )

            print(
                f"[pipeline] Benchmark mode ON - loading NAB labels from {nab_label_file} "
                f"(key={nab_dataset_key})"
            )
            labels = load_nab_labels(
                data_index=df.index,
                labels_file=nab_label_file,
                dataset_key=nab_dataset_key,
            )
            n_anomaly_rows = int(labels.sum())
            print(f"[pipeline] Loaded {n_anomaly_rows} NAB anomaly rows")

        else:
            raise ValueError(
                f"Unknown label_source '{label_source}'. Expected 'synthetic' or 'nab'."
            )

    detectors = build_detectors()
    results = {}

    # Run detectors
    for detector in detectors:

        name = getattr(detector, "model_name", type(detector).__name__)

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
                    f"[pipeline] Detector {name} failed during benchmark - fix required"
                )

    # Print detector summaries
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

            pct = (n_anom / total * 100) if total > 0 else 0

        except Exception:

            print(f"[pipeline] Invalid anomaly_flag format for {name}")
            continue

        print(f"\n[pipeline] {name} results:")

        print(
            f"  Flagged: "
            f"{n_anom}/{total} ({pct:.1f}%)"
        )

        # Runtime
        if "runtime" in output:

            try:
                print(f"  Runtime: {float(output['runtime']):.3f}s")

            except Exception:

                print("  Runtime: unavailable")

        # Scores
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

                print(f"  Could not compute top 5 for {name}")

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
                    print(f"[pipeline] Evaluation failed for {name}: {e}")

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

            print("\n[pipeline] Benchmark Results (Precision / Recall / F1 / ROC-AUC):")
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
                plot_roc_curves(scored_results, labels)
            else:
                print(
                    "[pipeline] No detectors with continuous scores "
                    "available for ROC plotting"
                )

    return df, scaler, results


def run_train_test_benchmark(csv_path, detectors, train_ratio=0.7):
    print("[pipeline] Running train/test benchmark mode...")

    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    if "time" in df.columns:
        df = df.drop(columns=["time"])

    df.index = pd.date_range(start="2024-01-01", periods=len(df), freq="s")
    df = df.dropna()

    print(f"[pipeline] Loaded dataset from: {csv_path}")
    print(f"[pipeline] Loaded shape: {df.shape}")

    train_df, test_df = time_train_test_split(df, train_ratio=train_ratio)

    print(f"[pipeline] Train shape: {train_df.shape}")
    print(f"[pipeline] Test shape: {test_df.shape}")

    train_scaled, test_scaled, _ = scale_train_test(train_df, test_df)

    detectors = fit_trainable_detectors(detectors, train_scaled)

    test_injected, label_series = inject_all(test_scaled)
    try:
        n_injected = int((label_series != "normal").sum())
    except Exception:
        n_injected = int(label_series.sum())

    print(f"[pipeline] Injected {n_injected} anomalies into test split")

    test_with_labels = test_injected.copy()
    test_with_labels["is_anomaly"] = label_series

    test_features, true_labels = split_features_and_labels(
        test_with_labels, label_col="is_anomaly"
    )

    eval_rows = []

    for detector in detectors:
        name = getattr(detector, "model_name", type(detector).__name__)
        print(f"[pipeline] Running: {name}")

        try:
            output = detector.detect(test_features)

            if not isinstance(output, dict):
                raise ValueError(f"{name} did not return dict")

            if "anomaly_flag" not in output:
                raise ValueError(f"{name} missing anomaly_flag")

            row = evaluate(output, true_labels)
            row["detector"] = name
            eval_rows.append(row)

        except Exception as e:
            print(f"[pipeline] ERROR in {name}: {e}")
            raise RuntimeError(
                f"[pipeline] Detector {name} failed during train/test benchmark - fix required"
            )

    eval_df = pd.DataFrame(eval_rows)

    print("\n[pipeline] Train/Test Benchmark Results (Precision / Recall / F1):")
    print(eval_df.to_string(index=False))

    save_benchmark_outputs(eval_df)

    print("[pipeline] Train/test benchmark complete.")

    return eval_df


def parse_args(argv):
    parser = argparse.ArgumentParser(description="IoT anomaly detection pipeline")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default="datasets/complex.csv",
        help="Path to the input CSV file.",
    )
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="Run benchmark mode using synthetic or NAB labels.",
    )
    parser.add_argument(
        "--train-test",
        dest="train_test",
        action="store_true",
        help="Run train/test benchmark mode, requires --benchmark.",
    )
    parser.add_argument(
        "--label-source",
        dest="label_source",
        choices=["synthetic", "nab"],
        default="synthetic",
        help="Source of benchmark labels. 'synthetic' injects anomalies; 'nab' loads NAB windows.",
    )
    parser.add_argument(
        "--nab-label-file",
        dest="nab_label_file",
        default=None,
        help="Path to NAB combined_windows.json (required when --label-source nab).",
    )
    parser.add_argument(
        "--nab-dataset-key",
        dest="nab_dataset_key",
        default=None,
        help="Dataset key inside NAB combined_windows.json (e.g. realKnownCause/example.csv).",
    )
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = parse_args(sys.argv[1:])

    if args.train_test and not args.benchmark:
        print("[pipeline] ERROR: --train-test must be used together with --benchmark.")
        sys.exit(1)

    if args.train_test and args.label_source == "nab":
        print(
            "[pipeline] ERROR: NAB labels are not supported with --train-test yet. "
            "Use --benchmark without --train-test for NAB."
        )
        sys.exit(1)

    if args.label_source == "nab" and not args.benchmark:
        print("[pipeline] ERROR: --label-source nab must be used with --benchmark.")
        sys.exit(1)

    if args.label_source == "nab" and (not args.nab_label_file or not args.nab_dataset_key):
        print(
            "[pipeline] ERROR: NAB benchmark requires both --nab-label-file and --nab-dataset-key."
        )
        sys.exit(1)

    if args.benchmark and args.train_test:
        run_train_test_benchmark(args.csv_path, build_detectors())
    else:
        run_pipeline(
            args.csv_path,
            benchmark_mode=args.benchmark,
            label_source=args.label_source,
            nab_label_file=args.nab_label_file,
            nab_dataset_key=args.nab_dataset_key,
        )
