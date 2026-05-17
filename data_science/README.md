# Data Science and Models Pipeline

This folder contains the Data Science and Models team work for the Intelligent IoT Data Management project.

The main goal of this folder is to support IoT sensor analysis through:

- data preprocessing
- anomaly detection models
- benchmark evaluation
- NAB label loading
- synthetic anomaly injection
- report and plot generation
- handover documentation for future teams

This folder is part of the wider DataBytes capstone project, where the intended high-level system is:

```text
ThingSpeak
- Backend
- PostgreSQL Database
- Data Science / Models analysis
- Backend
- Frontend dashboard
```

The Models team focuses on the anomaly detection and benchmarking side of this system.

---

## Purpose of This Folder

The `data_science/` folder provides a shared anomaly detection pipeline that can:

- load IoT sensor datasets
- preprocess numeric time-series data
- run multiple anomaly detectors through one common interface
- evaluate detector outputs against ground-truth labels
- benchmark detectors under different conditions
- generate output files for reports, presentations, and handover
- compare detector behaviour across synthetic, train/test, and NAB benchmark modes

The folder is designed so that future team members can add new detectors without rewriting the whole benchmark system.

---

## High-Level Pipeline Flow

The general pipeline works like this:

```text
input dataset
- preprocessing
- label source
- detector execution
- evaluation
- report generation
- output files
```

More specifically:

```text
CSV or NAB dataset
- preprocessor.py
- anomaly_injector.py or nab_loader.py
- detectors/
- evaluator.py
- roc_plotter.py
- report_output.py
- final_report.py
- outputs/
```

---

## Main Folder Structure

```text
data_science/
├── README.md
├── BENCHMARKING_README.md
├── pipeline.py
├── run_all_benchmarks.py
├── preprocessor.py
├── anomaly_injector.py
├── evaluator.py
├── nab_loader.py
├── roc_plotter.py
├── report_output.py
├── final_report.py
├── requirements.txt
├── datasets/
├── detectors/
│   ├── README.md
│   ├── ADTK_DETECTORS_README.md
│   ├── OCSVM_README.md
│   ├── LOF_README.md
│   ├── ECOD_README.md
│   ├── COPOD_README.md
│   ├── THRESHOLDAD_README.md
│   ├── INTERQUARTILERANGE_README.md
│   └── detector implementation files
└── outputs/
    └── README.md
```

Some folders or generated files may not exist until benchmarks are run.

---

## Core Files

### `pipeline.py`

Main pipeline runner.

Responsibilities:

- load the selected dataset
- run preprocessing
- choose benchmark mode
- inject synthetic anomalies or load NAB labels
- build the detector list
- run each detector
- validate detector output format
- evaluate detector results
- save benchmark outputs
- generate per-benchmark reports and plots

Important functions:

```python
build_detectors()
run_pipeline()
run_train_test_benchmark()
save_benchmark_outputs()
```

This is the main file to inspect when understanding how detectors are connected to the benchmark system.

### `run_all_benchmarks.py`

Runs all benchmark modes in one command.

Default command:

```bash
python run_all_benchmarks.py
```

This runs:

```text
synthetic benchmark
train/test benchmark
NAB benchmark
final cross-benchmark report generation
```

It also supports skip flags:

```bash
python run_all_benchmarks.py --skip-nab
python run_all_benchmarks.py --skip-train-test
python run_all_benchmarks.py --skip-synthetic
```

Use this file when producing the final benchmark evidence.

### `preprocessor.py`

Loads and prepares datasets before they are passed into detectors.

Typical responsibilities:

- read CSV data
- clean column names
- handle time column/index setup
- select numeric values
- scale or prepare values where required
- return prepared data for the pipeline

The output from this file should be compatible with all detectors in the shared pipeline.

### `anomaly_injector.py`

Creates synthetic anomalies for controlled testing.

It supports:

- point spike anomalies
- level shift anomalies
- volatility shift anomalies
- combined anomaly injection through `inject_all()`

This file is used by:

```text
synthetic benchmark
train/test benchmark
```

The output is:

```text
modified dataset
ground-truth labels
```

The labels allow the evaluator to calculate metrics such as precision, recall, F1, and false positive rate.

### `nab_loader.py`

Loads NAB labels and converts them into benchmark labels.

NAB stands for Numenta Anomaly Benchmark.

This file:

- loads `combined_windows.json`
- supports local file paths or HTTPS URLs
- finds the correct NAB dataset key
- converts anomaly windows into boolean labels
- aligns labels with the input dataset timestamp index

This is used by:

```text
NAB benchmark
```

Important limitation:

The current project uses pointwise metrics for NAB evaluation. It does not yet implement the official NAB scoring profiles.

### `evaluator.py`

Computes detector performance metrics.

Supported metrics include:

```text
precision
recall
F1 score
AUC-ROC
number of predicted anomalies
number of actual anomalies
true positives
false positives
true negatives
false negatives
false positive rate
false negative rate
```

The evaluator supports both:

```text
boolean labels
string labels where "normal" means normal
```

This makes it compatible with both synthetic labels and NAB labels.

### `roc_plotter.py`

Generates ROC curve plots for detectors that return continuous anomaly scores.

Important notes:

- detectors need a `score` output to appear in ROC plots
- higher scores should mean more anomalous
- detectors without scores may be skipped
- ROC-AUC may be unavailable if labels only contain one class

### `report_output.py`

Generates per-benchmark plots and text summaries.

It creates files such as:

```text
metrics_comparison.png
runtime_comparison.png
confusion_summary.png
model_flags_timeline.png
benchmark_report_summary.txt
```

These files are saved into benchmark-specific output folders.

### `final_report.py`

Generates cross-benchmark summaries.

It combines results from:

```text
outputs/synthetic_benchmark/
outputs/train_test_benchmark/
outputs/nab_benchmark/
```

and creates:

```text
final_benchmark_summary.csv
final_benchmark_report.txt
final_f1_comparison.png
final_auc_comparison.png
```

This is useful when comparing detectors across all benchmark modes.

### `requirements.txt`

Lists Python dependencies needed by the Models pipeline.

Common dependencies include:

```text
pandas
numpy
matplotlib
seaborn
adtk
pyod
scikit-learn
```

Install dependencies from inside `data_science/`:

```bash
pip install -r requirements.txt
```

If ADTK produces pandas-related warnings or errors, check package versions. A safer setup may require pinning:

```text
pandas<3.0
adtk==0.6.2
```

Only pin versions after testing across the team environment.

---

## Detector System

Detector implementations live in:

```text
data_science/detectors/
```

At the latest checked state, the pipeline includes:

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

## Detector Categories

| Category | Detectors |
|---|---|
| ADTK-backed | PcaAD, LevelShiftAD, VolatilityShiftAD, QuantileAD |
| PyOD-based | ECOD, COPOD, LOF |
| scikit-learn-based | OCSVM |
| Custom statistical | ThresholdAD, InterQuartileRangeAD |

## Standard Detector Interface

Each detector should return a dictionary like this:

```python
{
    "model_name": str,
    "timestamp": df.index,
    "anomaly_flag": pd.Series,
    "score": pd.Series,
    "runtime": float
}
```

Notes:

- `anomaly_flag` is required.
- `model_name` is required by the evaluator.
- `score` is needed for ROC-AUC and ROC curve plotting.
- `runtime` is used for runtime comparison plots.
- Some older detectors may not return every optional field yet, but new detectors should follow the full interface.

For more detail, see:

```text
detectors/README.md
detectors/ADTK_DETECTORS_README.md
```

---

## Benchmark System

The benchmark system supports three benchmark modes.

### 1. Synthetic Benchmark

Uses:

```text
datasets/complex.csv
```

Runs:

```text
preprocessing
- synthetic anomaly injection
- detector execution
- metric evaluation
- output generation
```

Command:

```bash
python pipeline.py datasets/complex.csv --benchmark
```

Default output folder:

```text
outputs/synthetic_benchmark/
```

Best use:

- controlled detector sanity checks
- early model development
- checking whether detectors react to known injected anomalies

### 2. Train/Test Benchmark

Runs a more realistic split-based benchmark.

General flow:

```text
load clean data
- split into train and test
- fit trainable detectors on train
- inject anomalies into test
- evaluate on test
```

Recommended command:

```bash
python pipeline.py datasets/complex_clean.csv --benchmark --train-test
```

Default output folder:

```text
outputs/train_test_benchmark/
```

Best use:

- checking generalisation
- testing trainable detectors
- avoiding fit-and-evaluate-on-same-data behaviour

Important:

NAB labels are not supported with train/test mode.

### 3. NAB Benchmark

Uses the public NAB dataset:

```text
realKnownCause/machine_temperature_system_failure.csv
```

Command:

```bash
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"
```

Default output folder:

```text
outputs/nab_benchmark/
```

Best use:

- testing on real labelled anomaly windows
- checking whether detectors generalise beyond synthetic anomalies
- comparing detectors on a public benchmark dataset

Important:

The current NAB benchmark uses pointwise metrics, not the official NAB scoring profiles.

---

## Output System

Generated outputs live in:

```text
data_science/outputs/
```

Common generated files include:

```text
benchmark_results.csv
benchmark_results.json
metrics_comparison.png
runtime_comparison.png
confusion_summary.png
model_flags_timeline.png
benchmark_report_summary.txt
roc_curves.png
```

Cross-benchmark outputs include:

```text
final_benchmark_summary.csv
final_benchmark_report.txt
final_f1_comparison.png
final_auc_comparison.png
```

For full details, see:

```text
outputs/README.md
```

---

## How to Run

All commands below assume you are inside:

```text
data_science/
```

If you are in the project root, first run:

```bash
cd data_science
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run normal pipeline without benchmark mode

```bash
python pipeline.py datasets/complex.csv
```

### Run synthetic benchmark

```bash
python pipeline.py datasets/complex.csv --benchmark
```

### Run train/test benchmark

```bash
python pipeline.py datasets/complex_clean.csv --benchmark --train-test
```

### Run NAB benchmark

```bash
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"
```

### Run all benchmarks

```bash
python run_all_benchmarks.py
```

### Run all benchmarks except NAB

```bash
python run_all_benchmarks.py --skip-nab
```

---

## Relationship With Backend and Frontend

The Models pipeline is currently focused on benchmarking and evaluating anomaly detectors.

In the wider system, the intended role is:

```text
Backend retrieves/stores IoT data
- Models analyse sensor values
- anomaly results or insights are returned
- Backend exposes results through API
- Frontend displays charts, alerts, and insights
```

Potential outputs that may be useful for Backend/Frontend:

```text
anomaly_flag
score
model_name
timestamp
runtime
benchmark_results.json
```

Future integration work should decide:

- which detector or ensemble should be used in production
- whether predictions run in batch or real time
- what API response structure Backend expects
- how alerts should be displayed on the dashboard
- whether benchmark outputs should be exposed or only used internally

---

## Documentation Map

Use this map to find the right documentation file.

| File | Purpose |
|---|---|
| `README.md` | Main overview of the whole `data_science/` system |
| `BENCHMARKING_README.md` | Detailed explanation of benchmark modes, commands, and benchmark workflow |
| `outputs/README.md` | Explanation of generated output files |
| `detectors/README.md` | Detector index and standard detector interface |
| `detectors/ADTK_DETECTORS_README.md` | Group documentation for ADTK-backed detectors |
| `detectors/OCSVM_README.md` | OCSVM-specific documentation |
| `detectors/LOF_README.md` | LOF-specific documentation |
| `detectors/ECOD_README.md` | ECOD-specific documentation |
| `detectors/COPOD_README.md` | COPOD-specific documentation |
| `detectors/THRESHOLDAD_README.md` | ThresholdAD-specific documentation |
| `detectors/INTERQUARTILERANGE_README.md` | InterQuartileRangeAD-specific documentation |

---

## Suggested Workflow for Future Models Team Members

### To understand the system

1. Read this `README.md`.
2. Read `BENCHMARKING_README.md`.
3. Read `detectors/README.md`.
4. Run a synthetic benchmark.
5. Inspect `outputs/synthetic_benchmark/benchmark_results.csv`.

### To add a new detector

1. Create the detector file in `detectors/`.
2. Follow the standard detector interface.
3. Add the detector import in `pipeline.py`.
4. Register it inside `build_detectors()`.
5. Run:

```bash
python pipeline.py datasets/complex.csv --benchmark
```

6. If successful, run:

```bash
python pipeline.py datasets/complex_clean.csv --benchmark --train-test
```

7. If compatible, run NAB:

```bash
python run_all_benchmarks.py --skip-synthetic --skip-train-test
```

8. Add or update the detector README.

### To regenerate final benchmark evidence

```bash
python run_all_benchmarks.py
```

Then inspect:

```text
outputs/final_benchmark_report.txt
outputs/final_benchmark_summary.csv
outputs/final_f1_comparison.png
outputs/final_auc_comparison.png
```

---

## Known Limitations

- Official NAB scoring profiles are not implemented yet.
- Current NAB evaluation uses pointwise precision, recall, F1, and AUC-ROC.
- Some detectors do not return continuous scores, which limits ROC-AUC and ROC curve support.
- Some detectors may not return runtime yet.
- ADTK may produce warnings or compatibility issues with newer pandas versions.
- Synthetic benchmarks are useful for controlled testing but do not fully represent real-world sensor behaviour.
- No final production ensemble has been selected yet.
- Backend/Frontend integration still needs a final agreed API structure.

---

## Future Improvements

Possible future work:

- implement official NAB scoring profiles
- add a production ensemble strategy
- standardise all detector outputs fully
- pin dependency versions for reproducible results
- add unit tests for each detector
- add CI checks for benchmark smoke tests
- improve train/test benchmark dataset handling
- add feature-level explanations for anomaly results
- expose model results through Backend API
- connect anomaly outputs to Frontend dashboard alerts
- add a formal model registry or configuration file instead of hardcoding detector list in `build_detectors()`

---

## Quick Command Reference

```bash
# Move into folder
cd data_science

# Install dependencies
pip install -r requirements.txt

# Run normal pipeline
python pipeline.py datasets/complex.csv

# Run synthetic benchmark
python pipeline.py datasets/complex.csv --benchmark

# Run train/test benchmark
python pipeline.py datasets/complex_clean.csv --benchmark --train-test

# Run NAB benchmark
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"

# Run all benchmark modes
python run_all_benchmarks.py

# Run all except NAB
python run_all_benchmarks.py --skip-nab
```

---

## Final Note

This folder is intended to be both a working benchmark pipeline and a handover-ready Models system.

When making changes, keep the structure modular:

```text
detectors handle detection
evaluator handles metrics
report files handle outputs
pipeline handles orchestration
README files explain how to use and maintain the system
```

This will make it easier for future capstone teams to continue the project without needing to reverse-engineer the whole codebase.
