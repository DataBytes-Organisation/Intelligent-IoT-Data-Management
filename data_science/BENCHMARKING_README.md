# Benchmarking and Model Report Outputs

## Purpose

This benchmark system lets the Models team:

- Run all anomaly detection models against a chosen dataset.
- Compare detector performance side by side.
- Evaluate detectors under three different benchmark modes (synthetic, train/test, NAB).
- Generate CSV, JSON, plot, and written report outputs in one go.
- Help other team members (Backend, Frontend, mentors) understand model behaviour without having to read the code.

## Benchmark modes

### Synthetic benchmark

- Uses `datasets/complex.csv`.
- Injects synthetic anomalies into the data, then evaluates each detector against those known injections.
- Useful as a controlled sanity check while developing or tuning detectors.

### Train/test benchmark

- Splits the dataset into a training section and a test section.
- Fits trainable detectors on the training data where supported.
- Injects synthetic anomalies into the test split only.
- Useful for a more realistic evaluation because fitting and testing happen on different data.

### NAB benchmark

- Uses the real NAB `machine_temperature_system_failure.csv` dataset, loaded directly from the raw GitHub URL.
- Uses the official NAB `combined_windows.json` for ground-truth anomaly windows.
- Useful for testing against real labelled anomaly events from a public benchmark.
- **Limitation:** this currently uses pointwise precision / recall / F1 / AUC, not the official NAB scoring profiles (Standard, Reward Low FP, Reward Low FN). NAB labels are wide windows around real failure events, so pointwise metrics under-reward detectors that fire only at the moment of regime change.

## Main command

From inside `data_science/`:

```
python run_all_benchmarks.py
```

This runs:

- the synthetic benchmark,
- the train/test benchmark,
- the NAB benchmark, and
- the final cross-benchmark report generation step.

## Optional skip flags

You can skip any benchmark group:

```
python run_all_benchmarks.py --skip-nab
python run_all_benchmarks.py --skip-train-test
python run_all_benchmarks.py --skip-synthetic
```

When each is useful:

- `--skip-nab` — when you have no internet access or want a fast local-only run.
- `--skip-train-test` — when you only care about the simpler synthetic check or the realistic NAB run.
- `--skip-synthetic` — when you want to focus on the more realistic train/test and NAB results.

You can also combine flags, for example `--skip-train-test --skip-nab` to run only the synthetic benchmark.

## Output folder structure

After a full run you should see:

```
outputs/
  synthetic_benchmark/
  train_test_benchmark/
  nab_benchmark/
  final_benchmark_summary.csv
  final_benchmark_report.txt
  final_f1_comparison.png
  final_auc_comparison.png
```

Each per-mode folder contains:

```
benchmark_results.csv
benchmark_results.json
metrics_comparison.png
runtime_comparison.png
confusion_summary.png
model_flags_timeline.png
benchmark_report_summary.txt
roc_curves.png            (synthetic and NAB only — train/test does not produce ROC)
```

If a benchmark group is skipped, its folder is simply not created and the final report notes it as "not available".

## What each output means

- **`benchmark_results.csv` / `benchmark_results.json`** — exact per-detector metrics (precision, recall, F1, AUC, n_predicted, n_actual, plus TP/FP/TN/FN and FPR/FNR). Useful for technical comparison and as a feed for downstream tooling.
- **`metrics_comparison.png`** — grouped bars comparing precision, recall, F1, and AUC across detectors. Useful for quickly identifying strong models.
- **`runtime_comparison.png`** — bar chart of detector runtime. Useful when discussing real-time / backend feasibility.
- **`confusion_summary.png`** — stacked TP / FP / FN / TN per detector. Useful for understanding false alarms vs. missed anomalies.
- **`model_flags_timeline.png`** — per-detector vertical-tick scatter on a shared time axis (with a ground-truth row when labels are available). Useful for seeing whether models agree on the same anomaly periods.
- **`benchmark_report_summary.txt`** — short auto-written summary for one benchmark mode (best F1, best AUC, fastest, most conservative, most sensitive). Useful for quick standups and team updates.
- **`roc_curves.png`** — ROC curves for detectors that produce continuous scores. Useful for threshold-independent comparison.
- **`final_benchmark_summary.csv`** — combined per-detector rows from every available benchmark, with a `benchmark_type` column. Useful for comparing the same detector across benchmark modes in one table.
- **`final_benchmark_report.txt`** — auto-written conclusions across all benchmark modes (best F1, best AUC ignoring NaN, fastest, most conservative, most sensitive — for each mode). Useful for non-technical team members, mentors, and presentation prep.
- **`final_f1_comparison.png`** and **`final_auc_comparison.png`** — grouped bars comparing each detector's F1 / AUC across benchmark types. Useful for deciding which detectors are consistently strong rather than only good in one mode.

## Insights the team can extract

Examples of questions these outputs help answer:

- Which detector performs best overall (across all three benchmark modes)?
- Which detector has the strongest F1 on real NAB data?
- Which detector is fastest, and is that fast enough for real-time use?
- Which detector is conservative and flags very few anomalies (fewer false alarms but more misses)?
- Which detector is sensitive and catches more anomalies (more recall but more false alarms)?
- Which models agree on anomaly periods (look at `model_flags_timeline.png`)?
- Which models produce too many false positives (look at `confusion_summary.png` and FPR)?
- Which models miss too many real anomalies (look at recall and FNR)?
- Which benchmark type is hardest for the current detectors (compare per-mode F1/AUC)?

## Known limitations

- Official NAB scoring profiles (Standard, Reward Low FP, Reward Low FN with sigmoid window weighting) are not implemented yet.
- Current NAB evaluation uses pointwise precision, recall, F1, and AUC.
- ROC curves may be skipped or print warnings when only one class is present in a slice of labels.
- ADTK may print pandas `FutureWarning`s from library internals during detection — these come from the library, not from this project's code.
- Generated outputs under `outputs/` are ignored by git and should not be committed.

## Suggested workflow

1. Run all benchmarks:
   ```
   python run_all_benchmarks.py
   ```
2. Open `outputs/final_benchmark_report.txt` for the high-level conclusions.
3. Open `outputs/final_benchmark_summary.csv` for the combined per-detector numbers.
4. Inspect the plots inside each per-benchmark folder for deeper detail (timeline, confusion, runtime, metrics).
5. Use the conclusions for team updates, PR descriptions, capstone reports, and Backend / Frontend discussions about which detectors to surface in the dashboard.
