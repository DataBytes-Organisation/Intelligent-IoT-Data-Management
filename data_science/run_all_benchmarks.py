"""
Run all benchmark modes (synthetic, train/test, NAB) in one command.

Usage:
    python run_all_benchmarks.py
    python run_all_benchmarks.py --skip-nab
    python run_all_benchmarks.py --skip-train-test --skip-nab
"""

import argparse
import sys
import traceback

from pipeline import (
    build_detectors,
    run_pipeline,
    run_train_test_benchmark,
)
from final_report import generate_final_outputs


SYNTHETIC_CSV = "datasets/complex.csv"

NAB_CSV_URL = (
    "https://raw.githubusercontent.com/numenta/NAB/master/data/"
    "realKnownCause/machine_temperature_system_failure.csv"
)
NAB_LABELS_URL = (
    "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json"
)
NAB_DATASET_KEY = "realKnownCause/machine_temperature_system_failure.csv"


def _header(title):
    line = "=" * 60
    print(f"\n{line}\n{title}\n{line}")


def run_synthetic():
    _header("Running synthetic benchmark")
    run_pipeline(
        SYNTHETIC_CSV,
        benchmark_mode=True,
        label_source="synthetic",
    )


def run_train_test():
    _header("Running train/test benchmark")
    run_train_test_benchmark(
        SYNTHETIC_CSV,
        build_detectors(),
    )


def run_nab():
    _header("Running NAB benchmark")
    run_pipeline(
        NAB_CSV_URL,
        benchmark_mode=True,
        label_source="nab",
        nab_label_file=NAB_LABELS_URL,
        nab_dataset_key=NAB_DATASET_KEY,
    )


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Run all benchmark modes and save outputs to per-mode folders."
    )
    parser.add_argument("--skip-synthetic", action="store_true",
                        help="Skip the synthetic benchmark.")
    parser.add_argument("--skip-train-test", action="store_true",
                        help="Skip the train/test benchmark.")
    parser.add_argument("--skip-nab", action="store_true",
                        help="Skip the NAB benchmark.")
    return parser.parse_args(argv)


def main(argv):
    args = parse_args(argv)

    steps = []
    if not args.skip_synthetic:
        steps.append(("synthetic benchmark", run_synthetic))
    if not args.skip_train_test:
        steps.append(("train/test benchmark", run_train_test))
    if not args.skip_nab:
        steps.append(("NAB benchmark", run_nab))

    if not steps:
        print("[run_all] All benchmark groups skipped - nothing to do.")
        return 0

    for name, fn in steps:
        try:
            fn()
        except Exception as e:
            print(f"\n[run_all] ERROR while running {name}: {e}")
            traceback.print_exc()
            return 1

    _header("Generating final cross-benchmark summary")
    try:
        generate_final_outputs("outputs")
    except Exception as e:
        print(f"\n[run_all] ERROR while generating final report: {e}")
        traceback.print_exc()
        return 1

    _header("Benchmark suite complete")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
