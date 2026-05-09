import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# Ensure the project root is on the import path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from data_science.algorithms.correlation_based import correlation_based
from data_science.algorithms.mean_based import mean_based
from data_science.algorithms.volatility_based import volatility_based
from data_science.detectors.thresholdad import threshold_ad


# ---------------------------------------------------------------------------
# Data Loading & Preprocessing
# ---------------------------------------------------------------------------

def load_data(csv_path):
    """Load a CSV file and return a raw DataFrame."""
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()
    print(f"[pipeline] Loaded {len(df)} rows x {len(df.columns)} columns from {csv_path}")
    return df


def preprocess(df):
    """
    Normalise an IoT CSV into a clean DataFrame with a 'created_at' datetime
    index suitable for the anomaly-detection algorithms.

    Steps:
      1. Rename the first column to 'created_at' (or create synthetic timestamps).
      2. Coerce / generate datetime values at 10-minute intervals.
      3. Drop all-null rows & columns, interpolate remaining NaNs linearly.
      4. Return the cleaned DataFrame indexed by 'created_at'.
    """
    df = df.copy()

    # Standardise the time column
    first_col = df.columns[0]
    if first_col != "created_at":
        df.rename(columns={first_col: "created_at"}, inplace=True)

    # Try to parse existing datetime values; fall back to synthetic timestamps
    try:
        df["created_at"] = pd.to_datetime(df["created_at"], utc=True).dt.tz_localize(None)
    except (ValueError, TypeError):
        # Generate synthetic 10-min-interval timestamps starting 2025-01-01
        df["created_at"] = [datetime(2025, 1, 1, 0, 0) + timedelta(minutes=10 * i)
                            for i in range(len(df))]

    df.sort_values(by="created_at", inplace=True)
    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    # Identify numeric sensor columns
    sensor_cols = [c for c in df.columns if c != "created_at"]
    numeric_cols = df[sensor_cols].select_dtypes(include=[np.number]).columns.tolist()
    df[numeric_cols] = df[numeric_cols].interpolate(method="linear", limit_direction="both")
    df.dropna(subset=numeric_cols, how="any", inplace=True)

    df.set_index("created_at", inplace=True)
    print(f"[pipeline] Preprocessed -> {len(df)} rows, streams: {list(df.columns)}")
    return df


# ---------------------------------------------------------------------------
# Algorithm Execution
# ---------------------------------------------------------------------------

ALGORITHMS = {
    "correlation": ("Correlation-based", correlation_based),
    "mean": ("Mean-based", mean_based),
    "volatility": ("Volatility-based", volatility_based),
    "threshold": ("ThresholdAD", threshold_ad),
}


def run_algorithm(df, streams, start_date, end_date, algo_key, threshold=None):
    """Run a single algorithm and return (label, results_dict)."""
    label, fn = ALGORITHMS[algo_key]
    if algo_key == "threshold":
        # ThresholdAD uses 'threshold' as the symmetric z-score cutoff
        results = fn(df, streams, start_date, end_date, threshold=threshold)
    else:
        results = fn(df, streams, start_date, end_date, threshold)
    return label, results


def run_all_algorithms(df, streams, start_date, end_date, threshold=None):
    """Run every algorithm and return an ordered dict of results."""
    all_results = {}
    for key in ALGORITHMS:
        label, results = run_algorithm(df, streams, start_date, end_date, key, threshold)
        all_results[label] = results
    return all_results


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_results(all_results):
    """Pretty-print algorithm results to stdout."""
    separator = "=" * 70
    for label, results in all_results.items():
        print(f"\n{separator}")
        print(f"  {label} Anomaly Detection Results")
        print(separator)
        for stream, metrics in results.items():
            outlier_flag = "OUTLIER" if metrics["is_outlier"] else "ok"
            print(f"  {stream:>20s}  avg_metric={metrics['avg_corr']:+.6f}  [{outlier_flag}]")
    print()


def results_to_json(all_results):
    """Convert results to a JSON-serialisable structure."""
    out = {}
    for label, results in all_results.items():
        out[label] = {
            stream: {
                "avg_metric": float(metrics["avg_corr"]),
                "is_outlier": bool(metrics["is_outlier"]),
            }
            for stream, metrics in results.items()
        }
    return out


# ---------------------------------------------------------------------------
# Benchmarking
# ---------------------------------------------------------------------------

def benchmark_step(name, fn, *args, **kwargs):
    """Run *fn* and return (result, elapsed_seconds)."""
    t0 = time.perf_counter()
    result = fn(*args, **kwargs)
    elapsed = time.perf_counter() - t0
    print(f"  [bench] {name:<35s}  {elapsed:.4f}s")
    return result, elapsed


def run_benchmark(df, streams, start_date, end_date, threshold=None):
    """Run every algorithm with timing and print a summary table."""
    print("\n" + "=" * 70)
    print("  BENCHMARK MODE")
    print("=" * 70)

    timings = {}

    for key in ALGORITHMS:
        label, fn = ALGORITHMS[key]
        if key == "threshold":
            _, elapsed = benchmark_step(
                label, fn, df, streams, start_date, end_date, threshold=threshold,
            )
        else:
            _, elapsed = benchmark_step(
                label, fn, df, streams, start_date, end_date, threshold,
            )
        timings[label] = elapsed

    total = sum(timings.values())
    print(f"\n  {'TOTAL':<35s}  {total:.4f}s")
    print("=" * 70 + "\n")
    return timings


# ---------------------------------------------------------------------------
# Visualisation (optional)
# ---------------------------------------------------------------------------

def generate_visualizations(df, streams, start_date, end_date):
    """Generate grouped bar chart for the streams (non-blocking save to disk)."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        from data_science.visualizations.grouped_bar_chart import grouped_bar_chart

        df_viz = df.copy().reset_index()
        grouped_bar_chart(df_viz, streams, start_date, end_date)

        out_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "grouped_bar_chart.png")
        plt.savefig(out_path, dpi=100, bbox_inches="tight")
        plt.close("all")
        print(f"[pipeline] Saved grouped bar chart -> {out_path}")
    except Exception as exc:
        print(f"[pipeline] Visualization skipped ({exc})")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="IoT Data Science Pipeline - anomaly detection & analysis",
    )
    parser.add_argument(
        "csv_path",
        help="Path to the input CSV file (e.g. datasets/complex.csv)",
    )
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="Enable performance benchmarking (time each algorithm)",
    )
    parser.add_argument(
        "--algorithm",
        choices=list(ALGORITHMS.keys()),
        default=None,
        help="Run a single algorithm instead of all (default: all)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=None,
        help="Override the automatic outlier threshold (for stream-level detectors) "
             "or set the z-score cutoff (for ThresholdAD)",
    )
    parser.add_argument(
        "--no-viz",
        action="store_true",
        help="Skip visualization generation",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Path to write JSON results (default: stdout only)",
    )
    return parser.parse_args(argv)


def resolve_csv_path(csv_path):
    """Resolve *csv_path* relative to the data_science directory if needed."""
    if os.path.isabs(csv_path):
        return csv_path

    if os.path.isfile(csv_path):
        return csv_path

    ds_dir = os.path.dirname(os.path.abspath(__file__))
    candidate = os.path.join(ds_dir, csv_path)
    if os.path.isfile(candidate):
        return candidate

    candidate = os.path.join(PROJECT_ROOT, csv_path)
    if os.path.isfile(candidate):
        return candidate

    return csv_path


def main(argv=None):
    args = parse_args(argv)

    csv_path = resolve_csv_path(args.csv_path)

    # 1. Load
    raw_df = load_data(csv_path)

    # 2. Preprocess
    df = preprocess(raw_df)
    streams = list(df.columns)

    if len(streams) < 1:
        print("[pipeline] ERROR: No numeric streams found.")
        sys.exit(1)

    # Determine date range from the data
    start_date = str(df.index.min())
    end_date = str(df.index.max())

    # 3. Run algorithms
    if args.benchmark:
        run_benchmark(df, streams, start_date, end_date, args.threshold)
        if args.algorithm:
            label, results = run_algorithm(
                df, streams, start_date, end_date, args.algorithm, args.threshold,
            )
            all_results = {label: results}
        else:
            all_results = run_all_algorithms(df, streams, start_date, end_date, args.threshold)
    else:
        if args.algorithm:
            label, results = run_algorithm(
                df, streams, start_date, end_date, args.algorithm, args.threshold,
            )
            all_results = {label: results}
        else:
            all_results = run_all_algorithms(df, streams, start_date, end_date, args.threshold)

    # 4. Print results
    print_results(all_results)

    # 5. Visualisations
    if not args.no_viz:
        generate_visualizations(df, streams, start_date, end_date)

    # 6. Optional JSON output
    if args.output:
        out_data = results_to_json(all_results)
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(out_data, f, indent=2)
        print(f"[pipeline] Results written to {args.output}")

    print("[pipeline] Done.")


if __name__ == "__main__":
    main()