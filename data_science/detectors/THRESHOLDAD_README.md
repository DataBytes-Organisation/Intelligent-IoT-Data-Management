# ThresholdADDetector

Type: Statistical anomaly detector  
Library: Custom implementation  
Owner: Haritha Gunarathna, DataBytes team  
Status: Complete

## What It Does

`ThresholdADDetector` computes Z-scores for each numeric sensor column and flags timestamps where any column exceeds a defined threshold. The default threshold is 3.0 standard deviations.

This detector is a simple statistical baseline for extreme sensor readings.

## Input / Output Format

### Input

Pandas DataFrame with numeric sensor columns.

Requirements:

- Rows represent sensor readings
- Columns represent numeric sensor channels
- Numeric values are required
- Missing values should be handled before detection

### Output

```python
{
    "model_name": "ThresholdADDetector",
    "timestamp": df.index,
    "anomaly_flag": pd.Series,
    "score": pd.Series,
    "runtime": float
}
```

The score is the mean absolute Z-score across numeric columns for each timestamp.

## How to Run

From inside `data_science/`:

```bash
python pipeline.py datasets/complex.csv --benchmark
```

Direct usage:

```python
from detectors.thresholdad import ThresholdADDetector

detector = ThresholdADDetector(threshold=3.0)
result = detector.detect(df)
```

## Dependencies

```text
pandas
numpy
```

This detector does not require ADTK, PyOD, or scikit-learn.

Install all project dependencies:

```bash
pip install -r requirements.txt
```

## Files in This Folder

```text
data_science/detectors/thresholdad.py
```

## Key Hyperparameters

The detector uses:

```python
ThresholdADDetector(threshold=3.0)
```

- `threshold=3.0`: number of standard deviations away from the mean required before a value is flagged.

## Benchmark Snapshot

| Benchmark | Precision | Recall | F1 Score | AUC-ROC | FPR |
|---|---:|---:|---:|---:|---:|
| Synthetic | 1.0000 | 0.2632 | 0.4167 | 0.9658 | 0.0000 |
| Train/test | 1.0000 | 0.1690 | 0.2892 | 0.8096 | 0.0000 |
| NAB | 0.9913 | 0.2019 | 0.3355 | 0.8322 | not checked |

The supplied handover documentation reports that the default 3.0 sigma threshold had low recall on the synthetic benchmark, catching roughly 26 percent of injected anomalies. Exact cross-benchmark values were not supplied in the detector handover material.

## Known Limitations

- Low recall at the default threshold.
- Assumes approximately Gaussian data.
- Sensitive to outliers in the reference data because mean and standard deviation are computed from the input.
- Does not model multivariate dependency patterns.
- Not fully documented yet for train/test or NAB results.

## Recommended Use

Use ThresholdAD as a simple, transparent baseline detector for extreme values. It is useful for quick sanity checks and easy-to-explain alerts, but it should not be used as a standalone detector for the final ensemble.

## References

- Z-score anomaly detection concept: https://en.wikipedia.org/wiki/Standard_score
- Shared Models benchmark pipeline: `data_science/pipeline.py`
