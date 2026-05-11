# ADTK Detectors

This README documents the detectors in the pipeline that directly use the ADTK library.

Current ADTK-backed detectors:

| Detector | File | ADTK component | Main purpose |
|---|---|---|---|
| `PcaADDetector` | `adtk_pcaad.py` | `PcaAD` | PCA-based multivariate pattern deviation |
| `LevelShiftADDetector` | `levelshiftad.py` | `LevelShiftAD` | Sustained baseline shifts |
| `VolatilityShiftADDetector` | `volatility_shift_ad.py` | `VolatilityShiftAD` | Changes in variance or signal instability |
| `QuantileADDetector` | `quantilead.py` | `QuantileAD` | Values outside quantile thresholds |

Note: `InterQuartileRangeADDetector` is not included in this README because the current implementation is custom pandas/IQR logic, not a direct ADTK wrapper.

## Shared Purpose

The ADTK detectors focus on time-series anomaly patterns. They are useful because IoT sensor data is usually time-ordered, and many sensor failures appear as changes over time rather than isolated abnormal points.

## Standard Interface

Expected detector output:

```python
{
    "model_name": str,
    "timestamp": df.index,
    "anomaly_flag": pd.Series,
    "score": pd.Series,
    "runtime": float
}
```

## PcaADDetector

**File:** `adtk_pcaad.py`  
**Current registration:** `PcaADDetector()`

`PcaADDetector` uses PCA-based anomaly detection to find readings that do not match the normal multivariate pattern across sensor columns.

Current notes:

- Uses ADTK `PcaAD(k=1)`.
- Returns `anomaly_flag`, `model_name`, and `timestamp`.
- Does not currently return a continuous `score`, so ROC-AUC may be unavailable for this detector.

Known limitations:

- Can be conservative depending on data.
- Does not directly explain which sensor caused the anomaly.
- Depends on scaling and preprocessing quality.

## LevelShiftADDetector

**File:** `levelshiftad.py`  
**Current registration:** `LevelShiftADDetector(window=10, c=6.0)`

`LevelShiftADDetector` detects sustained baseline changes in sensor readings. It compares neighbouring windows and flags points where the signal appears to move to a new level.

Key parameters:

- `window=10`: number of readings used in each comparison window.
- `c=6.0`: sensitivity threshold. Higher values make the detector stricter.

Known limitations:

- Not designed for brief point spikes.
- Can miss gradual drift.
- Needs enough data around each point to compare windows.
- Best used with point or multivariate detectors.

## VolatilityShiftADDetector

**File:** `volatility_shift_ad.py`  
**Current registration:** `VolatilityShiftADDetector()`

`VolatilityShiftADDetector` detects sudden changes in signal variance or instability. Instead of focusing only on high or low values, it identifies periods where a sensor becomes unusually noisy or unusually stable.

Key parameters:

- `window=10`: rolling window size.
- `c=6.0`: sensitivity threshold.
- `side="both"`: detects both increases and decreases in volatility.

Known limitations:

- Can produce false positives in naturally noisy signals.
- Less effective for slow trend anomalies.
- Performance is sensitive to window size and threshold.
- ADTK/pandas version compatibility should be watched because ADTK can produce warnings or errors with newer pandas versions.

## QuantileADDetector

**File:** `quantilead.py`  
**Current registration:** `QuantileADDetector()`

`QuantileADDetector` flags values outside learned upper and lower quantile boundaries. It is a lightweight threshold-style detector for abnormal high or low readings.

Key parameters:

- `high=0.95`: upper quantile boundary.
- `low=0.05`: lower quantile boundary.

Current notes:

- The current implementation uses the first numeric sensor column only.
- It returns a continuous score based on distance outside the quantile thresholds.
- It is fast and useful as a simple baseline.

Known limitations:

- Only uses the first numeric sensor column in the current implementation.
- Does not model multivariate relationships.
- Can miss anomalies where each individual value is normal but the combination is unusual.

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

## Benchmark Role

The ADTK detectors are useful as specialist time-series detectors. They are not always the strongest overall benchmark performers, but they help cover anomaly patterns that general-purpose outlier detectors may miss.

- `LevelShiftADDetector` is useful for sustained baseline changes.
- `VolatilityShiftADDetector` is useful for noisy or unstable sensor behaviour.
- `QuantileADDetector` is useful as a simple threshold-style baseline.
- `PcaADDetector` is useful for multivariate pattern deviation, although the current implementation has limited score output support.

For exact latest benchmark results, see:

- `../BENCHMARKING_README.md`
- `../outputs/README.md`

## Recommended Use

ADTK detectors are best used as specialist time-series detectors:

- Use `LevelShiftADDetector` for persistent baseline changes.
- Use `VolatilityShiftADDetector` for noisy or unstable sensor behaviour.
- Use `QuantileADDetector` for simple high/low threshold-style checks.
- Use `PcaADDetector` for multivariate pattern deviation.

They should be combined with non-ADTK detectors such as OCSVM, LOF, ECOD, COPOD, ThresholdAD, and IQR to provide broader anomaly coverage.
