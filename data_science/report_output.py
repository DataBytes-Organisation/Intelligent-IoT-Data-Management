"""
Benchmark report outputs.

Generates extra plots and a text summary from a single benchmark run.
Inputs:
    eval_df    : pd.DataFrame with at least 'detector' column plus metrics
    results    : dict[str, dict] mapping detector name -> detector output
                 (may contain 'anomaly_flag', 'runtime', 'timestamp')
    labels     : ground-truth labels Series (boolean or string), or None
    output_dir : directory to write outputs into
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def _save(fig, output_dir, filename):
    path = Path(output_dir) / filename
    fig.tight_layout()
    fig.savefig(path, dpi=120, bbox_inches="tight")
    plt.close(fig)
    print(f"[report] Saved {path}")


def _plot_metrics_comparison(eval_df, output_dir):
    metrics = ["precision", "recall", "f1", "auc_roc"]
    available = [m for m in metrics if m in eval_df.columns]
    if not available or len(eval_df) == 0:
        print("[report] No metric columns - skipping metrics_comparison.png")
        return

    detectors = eval_df["detector"].astype(str).tolist()
    n = len(detectors)
    width = 0.8 / len(available)
    x = np.arange(n)

    fig, ax = plt.subplots(figsize=(max(8, n * 1.2), 5))
    for i, m in enumerate(available):
        values = pd.to_numeric(eval_df[m], errors="coerce").fillna(0).tolist()
        offset = (i - (len(available) - 1) / 2) * width
        ax.bar(x + offset, values, width, label=m)
    ax.set_xticks(x)
    ax.set_xticklabels(detectors, rotation=30, ha="right")
    ax.set_ylim(0, 1.05)
    ax.set_ylabel("Score")
    ax.set_title("Detector metrics comparison (NaN treated as 0)")
    ax.legend()
    _save(fig, output_dir, "metrics_comparison.png")


def _plot_runtime_comparison(results, output_dir):
    rows = []
    for name, output in results.items():
        rt = output.get("runtime")
        if rt is None:
            continue
        try:
            rows.append((name, float(rt)))
        except (TypeError, ValueError):
            continue

    if not rows:
        print("[report] No runtime data available - skipping runtime_comparison.png")
        return

    rows.sort(key=lambda r: r[1])
    names, vals = zip(*rows)
    fig, ax = plt.subplots(figsize=(max(8, len(names) * 1.2), 5))
    ax.bar(names, vals)
    ax.set_xticklabels(names, rotation=30, ha="right")
    ax.set_ylabel("Runtime (s)")
    ax.set_title("Runtime per detector")
    _save(fig, output_dir, "runtime_comparison.png")


def _plot_confusion_summary(eval_df, output_dir):
    needed = ["true_positives", "false_positives", "false_negatives", "true_negatives"]
    if not all(c in eval_df.columns for c in needed) or len(eval_df) == 0:
        print("[report] Confusion fields missing - skipping confusion_summary.png")
        return

    detectors = eval_df["detector"].astype(str).tolist()
    tp = pd.to_numeric(eval_df["true_positives"], errors="coerce").fillna(0).values
    fp = pd.to_numeric(eval_df["false_positives"], errors="coerce").fillna(0).values
    fn = pd.to_numeric(eval_df["false_negatives"], errors="coerce").fillna(0).values
    tn = pd.to_numeric(eval_df["true_negatives"], errors="coerce").fillna(0).values

    fig, ax = plt.subplots(figsize=(max(8, len(detectors) * 1.2), 5))
    bottom = np.zeros(len(detectors))
    for label, vals, color in [
        ("TP", tp, "tab:green"),
        ("FP", fp, "tab:red"),
        ("FN", fn, "tab:orange"),
        ("TN", tn, "tab:blue"),
    ]:
        ax.bar(detectors, vals, bottom=bottom, label=label, color=color)
        bottom = bottom + vals
    ax.set_xticklabels(detectors, rotation=30, ha="right")
    ax.set_ylabel("Count")
    ax.set_title("Confusion summary per detector (stacked TP/FP/FN/TN)")
    ax.legend()
    _save(fig, output_dir, "confusion_summary.png")


def _to_bool_series(flags, fallback_index=None):
    if isinstance(flags, pd.Series):
        s = flags
    else:
        if fallback_index is None:
            return None
        s = pd.Series(flags, index=fallback_index)
    try:
        return s.astype(bool)
    except (TypeError, ValueError):
        return s.fillna(False).astype(bool)


def _plot_flags_timeline(results, labels, output_dir):
    rows = []

    if labels is not None:
        labels_series = pd.Series(labels)
        if labels_series.dtype == bool:
            labels_bool = labels_series
        else:
            labels_bool = labels_series != "normal"
        rows.append(("ground_truth", labels_bool))

    for name, output in results.items():
        flags = output.get("anomaly_flag")
        if flags is None:
            continue
        ts = output.get("timestamp")
        s = _to_bool_series(flags, fallback_index=ts)
        if s is None or len(s) == 0:
            continue
        rows.append((name, s))

    if not rows:
        print("[report] No flag data - skipping model_flags_timeline.png")
        return

    fig, ax = plt.subplots(figsize=(14, max(4, len(rows) * 0.6)))
    for i, (name, series) in enumerate(rows):
        try:
            mask = series.values.astype(bool)
        except (TypeError, ValueError):
            continue
        idx = series.index[mask]
        if len(idx) == 0:
            continue
        ax.scatter(idx, [i] * len(idx), s=6, marker="|")

    ax.set_yticks(range(len(rows)))
    ax.set_yticklabels([r[0] for r in rows])
    ax.set_xlabel("Time")
    ax.set_title("Anomaly flag timeline per detector")
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right")
    _save(fig, output_dir, "model_flags_timeline.png")


def _write_summary(eval_df, results, output_dir):
    lines = []
    lines.append("Benchmark report summary")
    lines.append("=" * 40)

    if len(eval_df) == 0:
        lines.append("No evaluation rows produced.")
    else:
        if "f1" in eval_df.columns:
            f1_series = pd.to_numeric(eval_df["f1"], errors="coerce")
            if f1_series.notna().any():
                i = f1_series.idxmax()
                lines.append(
                    f"Best F1:                          "
                    f"{eval_df.loc[i, 'detector']} (F1={f1_series.loc[i]:.4f})"
                )

        if "auc_roc" in eval_df.columns:
            auc_series = pd.to_numeric(eval_df["auc_roc"], errors="coerce")
            if auc_series.notna().any():
                i = auc_series.idxmax()
                lines.append(
                    f"Best AUC-ROC (NaN ignored):       "
                    f"{eval_df.loc[i, 'detector']} (AUC={auc_series.loc[i]:.4f})"
                )

        if "n_predicted" in eval_df.columns:
            np_series = pd.to_numeric(eval_df["n_predicted"], errors="coerce")
            if np_series.notna().any():
                i = np_series.idxmin()
                lines.append(
                    f"Most conservative (fewest flags): "
                    f"{eval_df.loc[i, 'detector']} (n_predicted={int(np_series.loc[i])})"
                )

        if "recall" in eval_df.columns:
            r_series = pd.to_numeric(eval_df["recall"], errors="coerce")
            if r_series.notna().any():
                i = r_series.idxmax()
                lines.append(
                    f"Most sensitive (highest recall):  "
                    f"{eval_df.loc[i, 'detector']} (recall={r_series.loc[i]:.4f})"
                )

    runtimes = []
    for name, output in results.items():
        rt = output.get("runtime")
        if rt is None:
            continue
        try:
            runtimes.append((name, float(rt)))
        except (TypeError, ValueError):
            continue
    if runtimes:
        n, t = min(runtimes, key=lambda x: x[1])
        lines.append(f"Fastest detector:                 {n} ({t:.4f}s)")
    else:
        lines.append("Fastest detector:                 (no runtime data)")

    lines.append("")
    lines.append(
        "Note: metrics depend on the benchmark type (synthetic, train/test, or NAB). "
    )
    lines.append(
        "NAB labels are wide windows around real failure events, so pointwise "
        "precision/recall under-rewards detectors that fire only at the moment "
        "of regime change."
    )

    path = Path(output_dir) / "benchmark_report_summary.txt"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[report] Saved {path}")


def generate_benchmark_report(eval_df, results, labels, output_dir="outputs"):
    """Generate all benchmark report outputs into output_dir."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    if eval_df is None:
        print("[report] eval_df is None - nothing to generate")
        return

    _plot_metrics_comparison(eval_df, output_dir)
    _plot_runtime_comparison(results or {}, output_dir)
    _plot_confusion_summary(eval_df, output_dir)
    _plot_flags_timeline(results or {}, labels, output_dir)
    _write_summary(eval_df, results or {}, output_dir)
