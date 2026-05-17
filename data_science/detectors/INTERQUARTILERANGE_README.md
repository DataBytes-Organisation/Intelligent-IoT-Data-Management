# InterQuartileRangeADDetector

Type: Statistical anomaly detector  
Library: Custom pandas implementation  
Owner: Saran Senthil Kumar, Models Team  
Status: Complete

## What It Does

`InterQuartileRangeADDetector` detects strong statistical outliers using the Interquartile Range method. It computes Q1, Q3, and IQR for each numeric sensor column, then flags values that fall outside the expected lower or upper bounds.

This is useful for identifying unusually high or low readings in IoT sensor data.

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
    "model_name": "InterQuartileRangeAD",
    "timestamp": df.index,
    "anomaly_flag": pd.Series,
    "score": pd.Series
}
```

The score is based on the distance outside the IQR boundary.

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
```

Install all project dependencies:

```bash
pip install -r requirements.txt
```

## Files in This Folder

```text
data_science/detectors/interquartile_range_ad.py
```

## Key Hyperparameters

The detector uses:

```python
InterQuartileRangeADDetector(factor=1.5)
```

- `factor=1.5`: multiplier applied to the IQR to define lower and upper anomaly bounds.

## Benchmark Snapshot

| Benchmark | Precision | Recall | F1 Score | AUC-ROC |
|---|---:|---:|---:|---:|
| Synthetic | 1.0000 | 0.1974 | 0.3297 | 0.5987 |
| Train/test | 1.0000 | 0.2817 | 0.4396 | 0.6408 |
| NAB | 0.5811 | 0.5877 | 0.5844 | 0.7779 |

## Known Limitations

- May miss gradual trend anomalies.
- Does not model temporal sequence behaviour.
- Sensitive to the `factor` threshold.
- Strongly focused on statistical outliers.
- Can produce false positives in highly dynamic environments.

## Recommended Use

Use InterQuartileRangeAD as a transparent statistical outlier detector. It is useful when you need a simple baseline that catches extreme high or low values with clear logic. It should be paired with multivariate and time-series detectors for broader anomaly coverage.

## References

- Interquartile range concept: https://en.wikipedia.org/wiki/Interquartile_range
- Numenta Anomaly Benchmark repository: https://github.com/numenta/NAB
