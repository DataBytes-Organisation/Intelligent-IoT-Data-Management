# COPODDetector

Type: ML-based anomaly detector  
Library: PyOD  
Owner: Bhavesh Hiraram Choudhary, Models Team  
Status: Complete

## What It Does

`COPODDetector` uses Copula-Based Outlier Detection to detect multivariate outliers. It models empirical copula distributions and flags observations that appear unusual across the joint distribution of sensor features.

This is useful for IoT sensor data where abnormal behaviour can appear as unusual relationships between multiple sensor channels.

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
    "model_name": "COPODDetector",
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
data_science/detectors/copod_detector.py
```

## Key Hyperparameters

The detector uses:

```python
COPODDetector(contamination=0.05)
```

- `contamination=0.05`: expected proportion of anomalies.

## Benchmark Snapshot

| Benchmark | Precision | Recall | F1 Score | AUC-ROC | FPR |
|---|---:|---:|---:|---:|---:|
| Synthetic | 0.4706 | 0.3158 | 0.3780 | 0.9145 | 0.0290 |
| Train/test | 0.5000 | 0.1127 | 0.1839 | 0.5323 | 0.0345 |
| NAB | 0.7815 | 0.3911 | 0.5213 | 0.8109 | 0.0121 |  
  
COPOD remained one of the strongest NAB detectors, with high precision and strong AUC-ROC, but the latest run shows ThresholdAD with the highest NAB AUC-ROC.

## Known Limitations

- Can be conservative depending on contamination and data distribution.
- Does not explicitly model time order.
- May miss temporal anomalies that are not distributional outliers.
- Like ECOD, it depends heavily on preprocessing and numeric feature quality.

## Recommended Use

Use COPOD as a strong multivariate outlier detector, especially when precision matters. It performed strongly on NAB compared with several other detectors and is useful as part of an ensemble with time-series detectors.

## References

- PyOD documentation: https://pyod.readthedocs.io/en/latest/
- Numenta Anomaly Benchmark repository: https://github.com/numenta/NAB
