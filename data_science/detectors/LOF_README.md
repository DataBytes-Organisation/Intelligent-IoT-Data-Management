# LOFDetector

Type: ML-based anomaly detector  
Library: PyOD  
Owner: Kimheang SRORN, Models Team  
Status: Complete

## What It Does

`LOFDetector` uses Local Outlier Factor to detect points that sit in unusually sparse neighbourhoods compared with nearby points. In the IoT anomaly detection pipeline, it identifies sensor readings that look unusual relative to similar readings around them.

This is useful for multivariate sensor anomalies where each individual sensor value may look normal, but the combination of values is unusual.

## Input / Output Format

### Input

Pandas DataFrame with numeric sensor columns.

Requirements:

- Rows represent time-ordered sensor readings
- Columns represent numeric sensor channels
- Index should align with the pipeline timestamp index
- Values should already be preprocessed and scaled where required
- Missing values should be handled before detection
- Minimum 2 rows required

### Output

```python
{
    "model_name": "LOFDetector",
    "timestamp": df.index,
    "anomaly_flag": pd.Series,
    "score": pd.Series,
    "runtime": float
}
```

The `score` output is taken from PyOD's decision scores, where higher values mean more anomalous.

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
data_science/detectors/lof_detector.py
```

## Key Hyperparameters

The detector uses:

```python
LOFDetector(contamination=0.05, n_neighbors=20)
```

- `contamination=0.05`: expected proportion of anomalies.
- `n_neighbors=20`: number of neighbours used to estimate local density.
- The implementation clamps `n_neighbors` to `n_samples - 1` for small datasets.

## Benchmark Snapshot

| Benchmark | Precision | Recall | F1 Score | AUC-ROC | FPR |
|---|---:|---:|---:|---:|---:|
| Synthetic | 0.8824 | 0.5921 | 0.7087 | 0.8445 | 0.0054 |
| Train/test | 1.0000 | 0.2254 | 0.3678 | 0.7954 | 0.0000 |
| NAB | 0.1269 | 0.0635 | 0.0846 | 0.5061 | not supplied |

## Known Limitations

- Conservative by design, so recall can be low.
- Does not detect sustained level shifts or gradual drift well.
- Performs poorly on NAB-style slow failure windows.
- Requires at least 2 samples.
- Distance-based performance can degrade with noisy or irrelevant sensor columns.

## Recommended Use

Use LOF when false positives need to be low and anomalies are expected to appear as local density outliers. It should be combined with time-series detectors such as LevelShiftAD and VolatilityShiftAD to catch sustained or temporal anomalies.

## References

- PyOD documentation: https://pyod.readthedocs.io/en/latest/
- PyOD LOF API: https://pyod.readthedocs.io/en/latest/_modules/pyod/models/lof.html
- Breunig et al. (2000), LOF: Identifying Density-Based Local Outliers
- Numenta Anomaly Benchmark repository: https://github.com/numenta/NAB
