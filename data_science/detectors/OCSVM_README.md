# OCSVMDetector

Type: ML-based anomaly detector  
Library: scikit-learn  
Owner: Lucas Hsueh, Models Team Junior Lead  
Status: Complete

## What It Does

`OCSVMDetector` uses a One-Class Support Vector Machine to detect unusual multivariate sensor readings. In the IoT anomaly detection pipeline, it learns a boundary around normal sensor behaviour and flags readings that fall outside that boundary as anomalies.

This is useful when anomalies are not only extreme values in one sensor, but unusual combinations of multiple sensor values.

## Input / Output Format

### Input

Pandas DataFrame with numeric sensor columns.

Requirements:

- Rows represent time-ordered sensor readings
- Columns represent numeric sensor channels
- Index should align with the pipeline timestamp index
- Values should already be preprocessed and scaled by the pipeline where required
- Missing values should be handled before detection

### Output

```python
{
    "anomaly_flag": pd.Series,
    "score": pd.Series,
    "model_name": "OCSVM",
    "timestamp": df.index,
    "runtime": float
}
```

`score` is based on the One-Class SVM decision function, flipped so that higher values mean more anomalous.

## How to Run

From inside `data_science/`:

```bash
python pipeline.py datasets/complex.csv --benchmark
python pipeline.py datasets/complex_clean.csv --benchmark --train-test
```

NAB benchmark:

```bash
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"
```

## Dependencies

```text
pandas
numpy
scikit-learn
```

The wider benchmark pipeline also uses `matplotlib`, `seaborn`, `adtk`, and `pyod`.

Install dependencies:

```bash
pip install -r requirements.txt
```

## Files in This Folder

```text
data_science/detectors/ocsvm_detector.py
```

Related files:

```text
data_science/pipeline.py
data_science/evaluator.py
data_science/report_output.py
```

## Key Hyperparameters

The current pipeline uses:

```python
OCSVMDetector(nu=0.05)
```

- `nu=0.05`: expected fraction of anomalies in the training data.
- `kernel="rbf"`: non-linear boundary for multivariate patterns.
- `gamma="scale"`: scikit-learn default used as a stable baseline.

## Benchmark Snapshot

| Benchmark | Precision | Recall | F1 Score | AUC-ROC | FPR |
|---|---:|---:|---:|---:|---:|
| Synthetic | 0.6500 | 0.5132 | 0.5735 | 0.7852 | 0.0225 |
| Train/test | 0.4792 | 0.9718 | 0.6419 | 0.9718 | 0.3233 |
| NAB | 0.4278 | 0.2116 | 0.2832 | 0.6622 | 0.0314 |

## Known Limitations

- Sensitive to `nu`, `kernel`, and `gamma`.
- Assumes the training data is mostly normal.
- Can produce false positives when the data distribution shifts.
- Works best with scaled numeric features.
- Does not directly explain which feature caused the anomaly.
- NAB pointwise metrics may understate performance because NAB labels are wide windows.

## Recommended Use

Use OCSVM as a strong general-purpose multivariate anomaly detector. It is especially useful when anomalies are unusual combinations of sensor readings and high recall is important. It should be used with other detectors rather than as the only alerting model.

## Full Documentation

See the shared team documentation for full analysis, plots, and comparison results.

## References

- scikit-learn OneClassSVM documentation: https://scikit-learn.org/stable/modules/generated/sklearn.svm.OneClassSVM.html
- scikit-learn outlier detection documentation: https://scikit-learn.org/stable/modules/outlier_detection.html
- Numenta Anomaly Benchmark repository: https://github.com/numenta/NAB
