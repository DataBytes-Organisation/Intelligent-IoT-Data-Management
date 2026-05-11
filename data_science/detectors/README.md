# Detectors

This folder contains the anomaly detection models used by the Models team benchmark pipeline for the Intelligent IoT Data Management project.

The active detectors in the latest checked fork state are registered in `data_science/pipeline.py` through `build_detectors()`:

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

### ADTK-backed detectors

| Detector | File | Main purpose |
|---|---|---|
| `PcaADDetector` | `adtk_pcaad.py` | PCA-based multivariate pattern deviation |
| `LevelShiftADDetector` | `levelshiftad.py` | Sustained baseline shifts |
| `VolatilityShiftADDetector` | `volatility_shift_ad.py` | Variance or instability changes |
| `QuantileADDetector` | `quantilead.py` | Values outside quantile boundaries |

See `ADTK_DETECTORS_README.md`.

### Non-ADTK detectors

| Detector | File | Library / method | Dedicated README |
|---|---|---|---|
| `OCSVMDetector` | `ocsvm_detector.py` | scikit-learn One-Class SVM | `OCSVM_README.md` |
| `LOFDetector` | `lof_detector.py` | PyOD Local Outlier Factor | `LOF_README.md` |
| `ECODDetector` | `ecod_detector.py` | PyOD ECOD | `ECOD_README.md` |
| `COPODDetector` | `copod_detector.py` | PyOD COPOD | `COPOD_README.md` |
| `ThresholdADDetector` | `thresholdad.py` | Custom Z-score threshold | `THRESHOLDAD_README.md` |
| `InterQuartileRangeADDetector` | `interquartile_range_ad.py` | Custom IQR threshold | `INTERQUARTILERANGE_README.md` |

## Standard Detector Interface

Each detector should return a dictionary compatible with the shared benchmark pipeline:

```python
{
    "model_name": str,
    "timestamp": df.index,
    "anomaly_flag": pd.Series,  # True = anomaly
    "score": pd.Series,         # higher = more anomalous, where available
    "runtime": float            # where available
}
```

Notes:

- `anomaly_flag` is required.
- `model_name` is required by the evaluator.
- `score` is needed for ROC-AUC and ROC curve plotting.
- `runtime` is used for runtime comparison plots.
- Detectors should use the DataFrame index as the timestamp reference.

## How to Add a New Detector

1. Create a detector file inside `data_science/detectors/`.
2. Implement a detector class with a `detect(df)` method.
3. Return the standard dictionary interface shown above.
4. Import the detector in `pipeline.py`.
5. Add the detector instance to `build_detectors()`.
6. Run the benchmark tests.

Recommended checks:

```bash
python -m py_compile detectors/your_detector.py
python pipeline.py datasets/complex.csv
python pipeline.py datasets/complex.csv --benchmark
python pipeline.py datasets/complex_clean.csv --benchmark --train-test
```

For NAB-compatible detectors:

```bash
python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"
```

## Important Implementation Notes

- Keep detector-specific logic inside the detector file.
- Avoid adding detector-specific reporting code directly into `pipeline.py` unless the team agrees.
- Do not modify unrelated detectors in a detector-specific PR.
- Generated benchmark outputs should normally stay out of Git unless they are intentionally committed as evidence.
- If a detector depends on a package, add or confirm it in `data_science/requirements.txt`.
