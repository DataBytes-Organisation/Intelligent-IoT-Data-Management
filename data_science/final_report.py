"""
Final cross-benchmark summary.

Reads each per-mode benchmark_results.csv (synthetic, train_test, nab),
combines them into one table tagged with `benchmark_type`, and writes:

  - outputs/final_benchmark_summary.csv
  - outputs/final_benchmark_report.txt
  - outputs/final_f1_comparison.png   (if data permits)
  - outputs/final_auc_comparison.png  (if data permits)

Tolerates missing benchmark folders: prints a warning and continues with
whatever results are available.
"""

import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


BENCHMARK_FOLDERS = {
    "synthetic": "synthetic_benchmark",
    "train_test": "train_test_benchmark",
    "nab": "nab_benchmark",
}

_FASTEST_RE = re.compile(r"Fastest detector:\s*(\S.*?)\s*\(([\d.]+)s\)\s*$")


def _read_fastest_from_summary(summary_path: Path):
    if not summary_path.exists():
        return None
    try:
        for line in summary_path.read_text(encoding="utf-8").splitlines():
            m = _FASTEST_RE.search(line)
            if m:
                return m.group(1), float(m.group(2))
    except Exception:
        return None
    return None


def load_benchmark_results(outputs_dir="outputs"):
    """
    Returns:
        combined_df : pd.DataFrame with benchmark_type column (may be empty)
        per_type    : dict[str, pd.DataFrame] for benchmarks that were found
        fastest     : dict[str, tuple[str, float]] parsed from per-mode summaries
        missing     : list[str] of benchmark types whose CSV was not found
    """
    base = Path(outputs_dir)
    per_type = {}
    fastest = {}
    missing = []
    frames = []

    for btype, folder in BENCHMARK_FOLDERS.items():
        csv_path = base / folder / "benchmark_results.csv"
        if not csv_path.exists():
            missing.append(btype)
            print(f"[final_report] Missing {csv_path} - skipping {btype}")
            continue
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            print(f"[final_report] Failed to read {csv_path}: {e}")
            missing.append(btype)
            continue

        df = df.copy()
        df["benchmark_type"] = btype
        per_type[btype] = df
        frames.append(df)

        f = _read_fastest_from_summary(base / folder / "benchmark_report_summary.txt")
        if f is not None:
            fastest[btype] = f

    if frames:
        combined = pd.concat(frames, ignore_index=True, sort=False)
    else:
        combined = pd.DataFrame()

    return combined, per_type, fastest, missing


def save_final_summary(combined_df: pd.DataFrame, outputs_dir="outputs"):
    out = Path(outputs_dir) / "final_benchmark_summary.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    if combined_df.empty:
        out.write_text("benchmark_type\n", encoding="utf-8")
        print(f"[final_report] No benchmark data available - wrote empty header to {out}")
        return
    cols = ["benchmark_type"] + [c for c in combined_df.columns if c != "benchmark_type"]
    combined_df[cols].to_csv(out, index=False)
    print(f"[final_report] Saved {out}")


def _detector_label(row):
    if "detector" in row and isinstance(row["detector"], str):
        return row["detector"]
    if "model" in row and isinstance(row["model"], str):
        return row["model"]
    return "(unknown)"


def _best_by(df, column, mode="max"):
    if column not in df.columns:
        return None
    series = pd.to_numeric(df[column], errors="coerce")
    if not series.notna().any():
        return None
    idx = series.idxmax() if mode == "max" else series.idxmin()
    row = df.loc[idx]
    return _detector_label(row), float(series.loc[idx])


def generate_final_report(per_type, fastest, missing, outputs_dir="outputs"):
    out = Path(outputs_dir) / "final_benchmark_report.txt"
    out.parent.mkdir(parents=True, exist_ok=True)

    lines = []
    lines.append("Final benchmark report")
    lines.append("=" * 60)

    if missing:
        lines.append(f"Benchmarks not available: {', '.join(missing)}")
    if per_type:
        lines.append(f"Benchmarks included:      {', '.join(per_type.keys())}")
    else:
        lines.append("No benchmark results were found.")
        out.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"[final_report] Saved {out}")
        return

    lines.append("")

    for btype, df in per_type.items():
        lines.append(f"--- {btype} ---")

        best_f1 = _best_by(df, "f1", "max")
        if best_f1:
            lines.append(f"Best F1:                          {best_f1[0]} (F1={best_f1[1]:.4f})")

        if "auc_roc" in df.columns:
            auc_series = pd.to_numeric(df["auc_roc"], errors="coerce")
            if auc_series.notna().any():
                idx = auc_series.idxmax()
                lines.append(
                    f"Best AUC-ROC (NaN ignored):       "
                    f"{_detector_label(df.loc[idx])} (AUC={auc_series.loc[idx]:.4f})"
                )
            else:
                lines.append("Best AUC-ROC (NaN ignored):       (no AUC values available)")

        if btype in fastest:
            name, secs = fastest[btype]
            lines.append(f"Fastest detector:                 {name} ({secs:.4f}s)")
        else:
            lines.append("Fastest detector:                 (runtime not available)")

        most_cons = _best_by(df, "n_predicted", "min")
        if most_cons:
            lines.append(
                f"Most conservative (fewest flags): "
                f"{most_cons[0]} (n_predicted={int(most_cons[1])})"
            )

        most_sens = _best_by(df, "recall", "max")
        if most_sens:
            lines.append(
                f"Most sensitive (highest recall):  "
                f"{most_sens[0]} (recall={most_sens[1]:.4f})"
            )

        lines.append("")

    lines.append("Overall conclusion")
    lines.append("-" * 60)
    lines.append(
        "The synthetic benchmark checks detector behaviour against injected "
        "anomalies in clean data, so it is most useful as a controlled sanity "
        "check rather than a measure of real-world performance."
    )
    lines.append(
        "The train/test benchmark splits the dataset and fits each trainable "
        "detector on the training portion before injecting anomalies into the "
        "test portion, giving a cleaner separation between fitting and "
        "evaluation than the synthetic mode."
    )
    lines.append(
        "The NAB benchmark uses real labelled anomaly windows from the "
        "Numenta Anomaly Benchmark, so it is the most realistic of the three. "
        "Note that NAB labels are wide windows around real failure events; "
        "pointwise precision/recall under-rewards detectors that fire only at "
        "the moment of regime change."
    )
    lines.append(
        "Limitation: the official NAB scoring system "
        "(application-profile / sigmoid window weighting) is not implemented "
        "yet — these numbers are pointwise comparisons only."
    )

    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[final_report] Saved {out}")


def _grouped_bar(metric_name, per_type, outputs_dir, filename, title):
    rows = []
    for btype, df in per_type.items():
        if metric_name not in df.columns:
            continue
        for _, row in df.iterrows():
            val = pd.to_numeric(pd.Series([row.get(metric_name)]), errors="coerce").iloc[0]
            rows.append((btype, _detector_label(row), val))
    if not rows:
        print(f"[final_report] No {metric_name} data available - skipping {filename}")
        return

    long_df = pd.DataFrame(rows, columns=["benchmark_type", "detector", metric_name])
    pivot = long_df.pivot_table(
        index="detector",
        columns="benchmark_type",
        values=metric_name,
        aggfunc="first",
    )

    detectors = pivot.index.tolist()
    btypes = list(pivot.columns)
    n_d = len(detectors)
    n_b = len(btypes)
    if n_d == 0 or n_b == 0:
        print(f"[final_report] No {metric_name} pivot data - skipping {filename}")
        return

    width = 0.8 / n_b
    x = np.arange(n_d)

    fig, ax = plt.subplots(figsize=(max(8, n_d * 1.2), 5))
    for i, b in enumerate(btypes):
        vals = pivot[b].fillna(0).tolist()
        offset = (i - (n_b - 1) / 2) * width
        ax.bar(x + offset, vals, width, label=b)
    ax.set_xticks(x)
    ax.set_xticklabels(detectors, rotation=30, ha="right")
    ax.set_ylim(0, 1.05)
    ax.set_ylabel(metric_name)
    ax.set_title(title)
    ax.legend()
    fig.tight_layout()
    out = Path(outputs_dir) / filename
    fig.savefig(out, dpi=120, bbox_inches="tight")
    plt.close(fig)
    print(f"[final_report] Saved {out}")


def generate_final_comparison_plots(per_type, outputs_dir="outputs"):
    if not per_type:
        return
    _grouped_bar(
        "f1", per_type, outputs_dir,
        "final_f1_comparison.png",
        "F1 by detector across benchmark types",
    )
    _grouped_bar(
        "auc_roc", per_type, outputs_dir,
        "final_auc_comparison.png",
        "AUC-ROC by detector across benchmark types (NaN -> 0)",
    )


def generate_final_outputs(outputs_dir="outputs"):
    combined, per_type, fastest, missing = load_benchmark_results(outputs_dir)
    save_final_summary(combined, outputs_dir)
    generate_final_report(per_type, fastest, missing, outputs_dir)
    generate_final_comparison_plots(per_type, outputs_dir)
