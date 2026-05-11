# ECODDetector

Type: ML-based anomaly detector  
Library: PyOD  
Owner: Bhavesh Hiraram Choudhary, Models Team  
Status: Complete

## What It Does

`ECODDetector` uses Empirical Cumulative Distribution Outlier Detection to identify statistically unusual observations. It estimates how extreme each value is using empirical distribution behaviour and produces anomaly scores for multivariate sensor data.

This is useful for IoT streams where abnormal readings may appear as distribution-tail events across one or more sensor channels.

## Input / Output Format

### Input

Pandas DataFrame with numeric sensor columns.

Requirements:

- Rows represent sensor readings
- Columns represent numeric sensor channels
- Missing values should be handled before detection
- At least one numeric column is required

### Output

```python
{
    "model_name": "ECODDetector",
    "timestamp": df.index,
    "anomaly_flag": pd.Series,
    "score": pd.Series,
    "runtime": float
}
```

The `score` output is based on PyOD decision scores, where higher values mean more anomalous.

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
pyod
pandas
numpy
```

Install all project dependencies:

```bash
pip install -r requirements.txt
```

## Files in This Folder

```text
data_science/detectors/ecod_detector.py
```

## Key Hyperparameters

The detector uses:

```python
ECODDetector(contamination=0.05)
```

- `contamination=0.05`: expected proportion of anomalies.

## Benchmark Snapshot

| Benchmark | Precision | Recall | F1 Score | AUC-ROC | FPR |
|---|---:|---:|---:|---:|---:|
| Synthetic | 0.4314 | 0.2895 | 0.3465 | 0.9341 | 0.0311 |
| Train/test | 0.6250 | 0.1408 | 0.2299 | 0.7736 | 0.0259 |
| NAB | 0.4921 | 0.2460 | 0.3280 | 0.7925 | 0.0282 |

## Known Limitations

- Recall can be lower because ECOD may be conservative depending on contamination.
- Detects distributional outliers better than temporal changes.
- Does not directly model order, drift, or window-level behaviour.
- Performance depends on feature quality and preprocessing.

## Recommended Use

Use ECOD as a fast multivariate distribution-based detector. It is useful as a complementary detector in an ensemble because it produced strong AUC-ROC values in the benchmark outputs, even when F1 was lower.

## References

- PyOD documentation: https://pyod.readthedocs.io/en/latest/
- Numenta Anomaly Benchmark repository: https://github.com/numenta/NAB
