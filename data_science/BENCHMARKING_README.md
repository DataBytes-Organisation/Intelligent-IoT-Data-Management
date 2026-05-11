# Benchmarking and Model Report Outputs

## Purpose

This README documents the benchmark system inside `data_science/`.

The benchmark system lets the Models team:

- run all anomaly detection detectors against shared datasets
- compare detector performance side by side
- evaluate detectors under synthetic, train/test, and NAB benchmark modes
- generate CSV, JSON, plot, and text report outputs
- provide clear evidence for model selection, team handover, and dashboard planning
- help Backend, Frontend, mentors, and future Models members understand detector behaviour without reading every source file

This README focuses on the benchmark workflow. For detector-specific details, see:

```text
data_science/detectors/README.md
data_science/detectors/ADTK_DETECTORS_README.md
data_science/detectors/OCSVM_README.md
data_science/detectors/LOF_README.md
data_science/detectors/ECOD_README.md
data_science/detectors/COPOD_README.md
data_science/detectors/THRESHOLDAD_README.md
data_science/detectors/INTERQUARTILERANGE_README.md
```

---

## High-Level Benchmark Flow

The benchmark pipeline follows this general structure:

```text
dataset
- preprocessing
- benchmark label source
- detectors
- evaluator
- per-mode outputs
- final cross-benchmark summary
```

More specifically:

```text
CSV / NAB dataset
- preprocessor.py
- anomaly_injector.py OR nab_loader.py
- detector list from pipeline.py
- evaluator.py
- report_output.py
- final_report.py
- outputs/
```

The benchmark system is built around `pipeline.py`, and the full benchmark suite is triggered through `run_all_benchmarks.py`.

---

## Main Components

### `pipeline.py`

Main orchestration file.

Responsibilities:

- load and preprocess input data
- choose benchmark mode
- inject synthetic anomalies or load NAB labels
- build the detector list
- run each detector
- collect detector outputs
- evaluate predictions against labels
- save benchmark CSV and JSON files
- trigger plot/report generation

Key functions:

```python
build_detectors()
run_pipeline()
run_train_test_benchmark()
save_benchmark_outputs()
```

### `run_all_benchmarks.py`

Convenience runner for executing all benchmark modes in one command.

It runs:

1. synthetic benchmark
2. train/test benchmark
3. NAB benchmark
4. final cross-benchmark report generation

Default command:

```bash
python run_all_benchmarks.py
```

### `preprocessor.py`

Loads and prepares the input dataset before detectors run.

Responsibilities:

- load CSV data
- clean column names
- handle time index where required
- select numeric sensor data
- scale or prepare values for detector input

### `anomaly_injector.py`

Used by the synthetic and train/test benchmark modes.

Responsibilities:

- inject point spikes
- inject level shifts
- inject volatility shifts
- return modified data plus ground-truth labels

The main combined function is:

```python
inject_all()
```

Default anomaly mix:

```text
point anomalies
level shift anomalies
volatility shift anomalies
```

The output labels use `"normal"` for normal rows and anomaly type names for injected anomaly rows.

### `nab_loader.py`

Used by the NAB benchmark mode.

Responsibilities:

- load NAB `combined_windows.json`
- support both local file paths and HTTPS URLs
- find the requested NAB dataset key
- convert labelled NAB anomaly windows into a boolean label series
- align labels with the dataset timestamp index

Main function:

```python
load_nab_labels(data_index, labels_file, dataset_key)
```

### `evaluator.py`

Computes detector evaluation metrics.

Supported label formats:

- boolean labels, where `True = anomaly`
- string labels, where `"normal" = normal` and anything else is treated as anomaly

Metrics produced:

```text
precision
recall
f1
auc_roc
n_predicted
n_actual
true_positives
false_positives
true_negatives
false_negatives
false_positive_rate
false_negative_rate
```

### `roc_plotter.py`

Generates ROC curve plots for detectors that return continuous anomaly scores.

Important:

- detectors without a `score` output cannot produce ROC curves
- ROC curves may be skipped or produce warnings if labels contain only one class
- higher anomaly scores should mean more anomalous for ROC-AUC consistency

### `report_output.py`

Generates per-benchmark visual and text outputs.

It creates:

```text
metrics_comparison.png
runtime_comparison.png
confusion_summary.png
model_flags_timeline.png
benchmark_report_summary.txt
```

It also supports runtime comparison when detectors return `runtime`.

### `final_report.py`

Combines the results from all available benchmark modes.

It creates:

```text
final_benchmark_summary.csv
final_benchmark_report.txt
final_f1_comparison.png
final_auc_comparison.png
```

This is useful for comparing the same detector across benchmark types.

---

## Current Detector List

At the latest checked fork state, `build_detectors()` includes:

```python
PcaADDetector()
OCSVMDetector(nu=0.05)
LevelShiftADDetector(window=10, c=6.0)
VolatilityShiftADDetector()
QuantileADDetector()
ECODDetector()
COPODDetector()
InterQuartileRangeADDetector()
LOFDetector()
ThresholdADDetector()
```

Detector categories:

| Category | Detectors |
|---|---|
| ADTK-backed | PcaAD, LevelShiftAD, VolatilityShiftAD, QuantileAD |
| PyOD-based | ECOD, COPOD, LOF |
| scikit-learn-based | OCSVM |
| Custom statistical | ThresholdAD, InterQuartileRangeAD |

---

## Benchmark Modes

## 1. Synthetic Benchmark

### Purpose

The synthetic benchmark is a controlled sanity check.

It uses a known local dataset and injects artificial anomalies. Because the injected anomalies are known, the evaluator can compare detector predictions against exact labels.

### Dataset

```text
datasets/complex.csv
```

### Label source

```text
anomaly_injector.py
```

### What it tests

- Can detectors run successfully?
- Do detectors detect known injected anomalies?
- Which detector has the strongest F1, recall, precision, and AUC on controlled data?
- Which detectors are too sensitive or too conservative?

### Command

From inside `data_science/`:

```bash
python pipeline.py datasets/complex.csv --benchmark
```

Explicit output folder:

```bash
python pipeline.py datasets/complex.csv --benchmark --output-dir outputs/synthetic_benchmark
```

### Default output folder

```text
outputs/synthetic_benchmark/
```

### Notes

This benchmark is useful for development and tuning, but it should not be treated as final real-world performance. The anomalies are synthetic, and real sensor failures can behave differently.

---

## 2. Train/Test Benchmark

### Purpose

The train/test benchmark gives a cleaner evaluation structure for trainable detectors.

Instead of fitting and evaluating on the same full dataset, the pipeline:

```text
loads clean data
- splits by time order
- fits scaler on train only
- transforms train and test
- fits trainable detectors on train
- injects anomalies into test only
- evaluates on test only
```

This is especially important for detectors like OCSVM and future trainable models.

### Dataset

Current command uses:

```text
datasets/complex_clean.csv
```

However, `run_all_benchmarks.py` currently calls train/test using:

```text
datasets/complex.csv
```

If the team wants the cleaner controlled setup, update `SYNTHETIC_CSV` or the train/test call in `run_all_benchmarks.py` to use `datasets/complex_clean.csv`.

### Label source

```text
anomaly_injector.py
```

Synthetic anomalies are injected into the test split only.

### What it tests

- Can trainable detectors learn from a training section?
- How do detectors perform on unseen test data?
- Does a detector generalise better when fitting and evaluation are separated?
- How sensitive is the model to distribution changes?

### Command

Recommended command:

```bash
python pipeline.py datasets/complex_clean.csv --benchmark --train-test
```

Explicit output folder:

```bash
python pipeline.py datasets/complex_clean.csv --benchmark --train-test --output-dir outputs/train_test_benchmark
```

### Default output folder

```text
outputs/train_test_benchmark/
```

### Important restriction

Do not combine train/test with NAB:

```bash
python pipeline.py ... --benchmark --train-test --label-source nab
```

That is intentionally blocked because train/test mode injects synthetic anomalies into the test split, while NAB already has real labelled anomaly windows.

---

## 3. NAB Benchmark

### Purpose

The NAB benchmark uses real labelled anomaly windows from the Numenta Anomaly Benchmark.

This benchmark is more realistic than synthetic injection because it evaluates detectors against real failure events.

### Dataset

```text
realKnownCause/machine_temperature_system_failure.csv
```

The pipeline can load it directly from the NAB GitHub raw URL.

### Label source

```text
combined_windows.json
```

The labels are converted into a boolean series by `nab_loader.py`.

### What it tests

- How do detectors perform on real labelled anomaly windows?
- Which detectors generalise beyond synthetic injected anomalies?
- Which detectors handle gradual real-world failure behaviour?
- How much does pointwise evaluation under-reward detectors that fire only at transition moments?

### Command

From inside `data_science/`:

```bash
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"
```

Explicit output folder:

```bash
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv" --output-dir outputs/nab_benchmark
```

### Default output folder

```text
outputs/nab_benchmark/
```

### Important limitation

This project currently uses pointwise evaluation for NAB:

```text
precision
recall
F1
AUC-ROC
FPR
FNR
```

It does not yet implement the official NAB scoring profiles:

```text
Standard
Reward Low FP
Reward Low FN
```

Official NAB scoring uses window-aware sigmoid scoring. The current pointwise metrics can under-reward detectors that correctly fire near the moment of regime change but do not remain active across the full labelled anomaly window.

---

## Run All Benchmarks

From inside `data_science/`:

```bash
python run_all_benchmarks.py
```

This runs:

```text
synthetic benchmark
train/test benchmark
NAB benchmark
final cross-benchmark summary
```

### Optional Skip Flags

Skip NAB:

```bash
python run_all_benchmarks.py --skip-nab
```

Skip train/test:

```bash
python run_all_benchmarks.py --skip-train-test
```

Skip synthetic:

```bash
python run_all_benchmarks.py --skip-synthetic
```

Run only synthetic:

```bash
python run_all_benchmarks.py --skip-train-test --skip-nab
```

Run only NAB:

```bash
python run_all_benchmarks.py --skip-synthetic --skip-train-test
```

### When to use each flag

| Flag | Use when |
|---|---|
| `--skip-nab` | no internet access, faster local run, or NAB is not needed |
| `--skip-train-test` | only synthetic/NAB comparison is needed |
| `--skip-synthetic` | focusing on train/test and NAB only |

---

## Output Folder Structure

After a full run, the expected structure is:

```text
outputs/
├── synthetic_benchmark/
│   ├── benchmark_results.csv
│   ├── benchmark_results.json
│   ├── metrics_comparison.png
│   ├── runtime_comparison.png
│   ├── confusion_summary.png
│   ├── model_flags_timeline.png
│   ├── benchmark_report_summary.txt
│   └── roc_curves.png
├── train_test_benchmark/
│   ├── benchmark_results.csv
│   ├── benchmark_results.json
│   ├── metrics_comparison.png
│   ├── runtime_comparison.png
│   ├── confusion_summary.png
│   ├── model_flags_timeline.png
│   └── benchmark_report_summary.txt
├── nab_benchmark/
│   ├── benchmark_results.csv
│   ├── benchmark_results.json
│   ├── metrics_comparison.png
│   ├── runtime_comparison.png
│   ├── confusion_summary.png
│   ├── model_flags_timeline.png
│   ├── benchmark_report_summary.txt
│   └── roc_curves.png
├── final_benchmark_summary.csv
├── final_benchmark_report.txt
├── final_f1_comparison.png
└── final_auc_comparison.png
```

If a benchmark group is skipped, its folder may not be created, and the final report will treat that benchmark as unavailable.

---

## What Each Output Means

### `benchmark_results.csv`

Per-detector metrics in table format.

Typical columns:

```text
detector
precision
recall
f1
auc_roc
n_predicted
n_actual
true_positives
false_positives
true_negatives
false_negatives
false_positive_rate
false_negative_rate
model
```

Use this file for:

- exact metric comparison
- report tables
- dashboard planning
- further analysis in Excel, pandas, or notebooks

### `benchmark_results.json`

Same benchmark metrics as JSON.

Use this file for:

- programmatic access
- possible Backend/Frontend integration
- preserving structured benchmark output

### `metrics_comparison.png`

Grouped bar chart comparing:

```text
precision
recall
f1
auc_roc
```

Use this plot to quickly identify strong detectors for one benchmark mode.

### `runtime_comparison.png`

Bar chart of detector runtime in seconds.

Use this plot to discuss real-time feasibility and backend performance.

Important:

- only detectors returning `runtime` appear here
- some detectors may be missing if they do not report runtime

### `confusion_summary.png`

Stacked TP/FP/FN/TN chart per detector.

Use this plot to understand:

- how many true anomalies were caught
- how many false alarms were produced
- how many real anomalies were missed
- whether a detector is conservative or sensitive

### `model_flags_timeline.png`

Timeline showing when each detector flagged anomalies, with a ground-truth row where labels are available.

Use this plot to see:

- whether detectors agree on anomaly periods
- whether a detector fires too often
- whether a detector fires near actual labelled anomalies
- whether a detector misses entire anomaly windows

### `benchmark_report_summary.txt`

Short auto-written summary for one benchmark mode.

It identifies:

```text
Best F1
Best AUC-ROC
Most conservative detector
Most sensitive detector
Fastest detector
```

Use this file for quick standups, PR summaries, and team updates.

### `roc_curves.png`

ROC curves for detectors with continuous scores.

Use this plot for threshold-independent comparison.

Important:

- detectors without score output may be excluded
- if labels contain only one class, ROC-AUC may be skipped or show warnings
- train/test currently may not generate ROC curves depending on the pipeline path used

### `final_benchmark_summary.csv`

Combined benchmark table containing rows from all available benchmark modes.

Includes a `benchmark_type` column so the same detector can be compared across:

```text
synthetic
train_test
nab
```

Use this file for cross-benchmark comparison.

### `final_benchmark_report.txt`

High-level written report across benchmark modes.

It summarises best/worst detector patterns across synthetic, train/test, and NAB.

Use it for:

- team handover
- mentor updates
- presentation preparation
- high-level decision making

### `final_f1_comparison.png`

Grouped bar chart comparing F1 score across benchmark modes.

Use this to check whether a detector is consistently strong or only strong in one benchmark.

### `final_auc_comparison.png`

Grouped bar chart comparing AUC-ROC across benchmark modes.

Use this to compare threshold-independent performance across benchmark modes.

---

## Evaluation Metrics

| Metric | Meaning |
|---|---|
| Precision | Of all points flagged as anomalies, how many were actually anomalies |
| Recall | Of all actual anomalies, how many the detector caught |
| F1 Score | Harmonic mean of precision and recall |
| AUC-ROC | Threshold-independent ability to separate normal and anomalous points |
| FPR | False positive rate, normal points incorrectly flagged |
| FNR | False negative rate, anomaly points missed |
| TP | True positives, anomalies correctly flagged |
| FP | False positives, normal points incorrectly flagged |
| TN | True negatives, normal points correctly ignored |
| FN | False negatives, anomalies missed |

### How to Interpret Trade-Offs

A detector with high precision and low recall is conservative:

```text
few false alarms
but many missed anomalies
```

A detector with high recall and lower precision is sensitive:

```text
catches many anomalies
but creates more false alarms
```

F1 is useful as the main comparison metric because it balances precision and recall.

AUC-ROC is useful when a detector produces continuous scores and we want to compare separation quality without relying on one threshold.

---

## Benchmark Insights the Team Can Extract

The outputs help answer:

- Which detector performs best overall?
- Which detector performs best on synthetic anomalies?
- Which detector performs best on real NAB anomaly windows?
- Which detector has the best train/test generalisation?
- Which detector is fastest?
- Which detector produces the fewest false alarms?
- Which detector catches the most anomalies?
- Which detector misses too many anomalies?
- Which detectors agree on the same anomaly periods?
- Which detector is best suited for dashboard alerts?
- Which benchmark type is hardest for the current detector set?

---

## Known Results Summary

Based on the latest provided benchmark outputs:

### Synthetic benchmark

- Best F1: `OCSVMDetector`
- Best AUC-ROC: `ECODDetector`
- Most sensitive: `OCSVMDetector`
- Fastest: `COPODDetector`

### Train/test benchmark

- Best F1: `OCSVMDetector`
- Best AUC-ROC: `OCSVMDetector`
- Most sensitive: `OCSVMDetector`
- Fastest: `COPODDetector`

### NAB benchmark

- Best F1: `InterQuartileRangeAD`
- Best AUC-ROC: `COPODDetector`
- Most sensitive: `InterQuartileRangeAD`
- Fastest: `COPODDetector`

Important interpretation:

- OCSVM is very strong in controlled synthetic and train/test modes.
- COPOD and InterQuartileRangeAD perform strongly on NAB-style real labelled windows.
- NAB pointwise scoring should be interpreted carefully because labels cover broad anomaly windows.
- No single detector is perfect across every benchmark mode.

---

## Generated Outputs and Git

Generated benchmark outputs are useful for evidence, but they should usually not be committed unless the team intentionally wants to preserve final benchmark evidence.

Recommended rule:

```text
Commit source code and README documentation.
Avoid committing generated CSV, JSON, TXT, and PNG outputs unless needed for handover evidence.
```

Typical generated folders:

```text
data_science/outputs/synthetic_benchmark/
data_science/outputs/train_test_benchmark/
data_science/outputs/nab_benchmark/
```

The `.gitignore` should protect generated benchmark outputs. If the team wants to keep the folder structure, use:

```text
data_science/outputs/.gitkeep
```

---

## Troubleshooting

### NAB does not run

Possible causes:

- no internet connection
- NAB URL unavailable
- incorrect `--nab-dataset-key`
- incorrect label file path or URL

Check that this key is exact:

```text
realKnownCause/machine_temperature_system_failure.csv
```

### Train/test fails with NAB

This is expected. NAB is blocked with train/test mode because NAB already has labels, while train/test injects synthetic anomalies into the test split.

### ROC curve missing

Possible causes:

- detector does not return a continuous `score`
- benchmark labels contain only one class
- ROC plotting was not called for that benchmark path

### Runtime plot missing detectors

Only detectors that return `runtime` are included in `runtime_comparison.png`.

### ADTK warnings or errors

ADTK may produce pandas `FutureWarning`s from inside the library. These warnings are usually external to this project.

If ADTK errors appear, check package versions:

```bash
python -c "import pandas as pd; import adtk; print(pd.__version__); print(adtk.__version__)"
```

A safer dependency setup may require:

```text
pandas<3.0
adtk==0.6.2
```

### Output folder not created

Make sure the command is run from inside `data_science/`.

Also check whether the command completed successfully before the report generation step.

---

## Suggested Workflow

### Full benchmark evidence run

```bash
cd data_science
python run_all_benchmarks.py
```

Then inspect:

```text
outputs/final_benchmark_report.txt
outputs/final_benchmark_summary.csv
outputs/final_f1_comparison.png
outputs/final_auc_comparison.png
```

### Quick local sanity check

```bash
python run_all_benchmarks.py --skip-nab
```

### Synthetic-only detector debugging

```bash
python run_all_benchmarks.py --skip-train-test --skip-nab
```

### NAB-only real benchmark check

```bash
python run_all_benchmarks.py --skip-synthetic --skip-train-test
```

---

## Recommended Documentation Links

For full handover, this README should be used together with:

```text
data_science/README.md
data_science/detectors/README.md
data_science/detectors/ADTK_DETECTORS_README.md
data_science/outputs/README.md
```

Detector-specific README files should live in:

```text
data_science/detectors/
```

Examples:

```text
OCSVM_README.md
LOF_README.md
ECOD_README.md
COPOD_README.md
THRESHOLDAD_README.md
INTERQUARTILERANGE_README.md
```
