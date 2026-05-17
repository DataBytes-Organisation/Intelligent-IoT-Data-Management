# PcaADDetector

Type: ADTK-based anomaly detector  
Library: ADTK  
Owner: Josh / Models Team  
Status: Complete

## What It Does

`PcaADDetector` uses ADTK's PCA-based anomaly detection method to detect sensor readings that do not match the normal multivariate pattern of the dataset.

Instead of checking each sensor independently, PCA-based detection looks at the relationship between sensor columns. This makes it useful when an anomaly appears as an unusual combination of sensor values, even if each individual value does not look extremely high or low by itself.

In the current pipeline, `PcaADDetector` is one of the ADTK-backed detectors used as part of the benchmark comparison.

## Input / Output Format

### Input

Pandas DataFrame with numeric sensor columns.

Requirements:

- Rows represent time-ordered sensor readings
- Columns represent numeric sensor channels
- Index should align with the pipeline timestamp index
- Values should already be preprocessed by the pipeline
- Missing values should be handled before detection where possible

### Output

The current implementation returns:

    {
        "anomaly_flag": pd.Series,
        "model_name": "PcaAD",
        "timestamp": anomalies.index
    }

`anomaly_flag` contains boolean anomaly predictions:

    True  = anomaly
    False = normal

Important note:

The current implementation does not return `score` or `runtime`. This means it may not appear in some runtime plots, and ROC-AUC may be unavailable or shown as `NaN`.

## How to Run

From inside `data_science/`:

    python pipeline.py datasets/complex.csv --benchmark

Train/test benchmark:

    python pipeline.py datasets/complex_clean.csv --benchmark --train-test

NAB benchmark:

    python pipeline.py "https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/machine_temperature_system_failure.csv" --benchmark --label-source nab --nab-label-file "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json" --nab-dataset-key "realKnownCause/machine_temperature_system_failure.csv"

Run all benchmark modes:

    python run_all_benchmarks.py

## Dependencies

Main dependency:

    adtk

The wider benchmark pipeline also uses:

    pandas
    numpy
    matplotlib
    seaborn
    scikit-learn
    pyod

Install project dependencies from inside `data_science/`:

    pip install -r requirements.txt

## Files in This Folder

Main detector file:

    data_science/detectors/adtk_pcaad.py

Related files:

    data_science/pipeline.py
    data_science/evaluator.py
    data_science/report_output.py
    data_science/roc_plotter.py

## Current Implementation

The current detector implementation uses:

    PcaAD(k=1)

and is registered in `pipeline.py` through:

    PcaADDetector()

The current implementation flow is:

1. Create an ADTK `PcaAD` detector.
2. Run `fit_detect(df)` on the input DataFrame.
3. Drop `NaN` values returned by ADTK.
4. Return anomaly flags, model name, and timestamps.

## Key Parameter

### `k=1`

The current implementation uses:

    PcaAD(k=1)

This controls the number of principal components used by ADTK's PCA anomaly detection process.

A low value such as `k=1` means the detector keeps a compact representation of the main pattern in the data and flags points that do not fit that pattern well.

## Benchmark Snapshot

Based on the latest benchmark run:

### Synthetic benchmark

| Metric | Value |
|---|---:|
| Precision | 1.0000 |
| Recall | 0.1316 |
| F1 Score | 0.2326 |
| AUC-ROC | N/A |
| Predicted Anomalies | 10 |
| Actual Anomalies | 76 |

### Train/test benchmark

| Metric | Value |
|---|---:|
| Precision | 1.0000 |
| Recall | 0.0423 |
| F1 Score | 0.0811 |
| AUC-ROC | N/A |
| Predicted Anomalies | 3 |
| Actual Anomalies | 71 |

### NAB benchmark

| Metric | Value |
|---|---:|
| Precision | 1.0000 |
| Recall | 0.0639 |
| F1 Score | 0.1202 |
| AUC-ROC | N/A |
| Predicted Anomalies | 145 |
| Actual Anomalies | 2268 |

## Interpretation

`PcaADDetector` behaved as a very conservative detector in the latest benchmark outputs.

It achieved very high precision because most points it flagged were true anomalies. However, recall was low, meaning it missed many anomaly points. This suggests that the detector is strict and only flags points that strongly break the PCA-based pattern.

This behaviour can be useful when the team wants fewer false alarms, but it is not ideal when the goal is to catch as many anomalies as possible.

## Known Limitations

- Current implementation does not return a continuous `score`, limiting ROC-AUC support.
- Current implementation does not return `runtime`, limiting runtime comparison support.
- Low recall in the latest benchmark outputs means it misses many anomalies.
- It may be too conservative with the current `k=1` configuration.
- PCA-based detection can be harder to interpret because it does not directly explain which original sensor caused the anomaly.
- Performance depends on preprocessing and scaling quality.
- ADTK may produce pandas-related warnings depending on local package versions.

## Recommended Use

Use `PcaADDetector` as a conservative multivariate pattern detector.

It is useful when:

- false positives should be kept low
- anomalies are expected to break relationships between sensor columns
- the team wants a PCA-based comparison against other detector types

It should not be used as the only anomaly detector because its recall is low in the current benchmark results. It is better used alongside more sensitive detectors such as OCSVM, LOF, InterQuartileRangeAD, ThresholdAD, COPOD, and other ADTK detectors.

## Suggested Future Improvements

Possible improvements:

- Add a `score` output so ROC-AUC and ROC curves can include PcaAD.
- Add a `runtime` output for runtime comparison plots.
- Test different `k` values.
- Check whether PcaAD should be fitted on train data separately in train/test mode.
- Add clearer handling of ADTK `NaN` outputs.
- Compare PcaAD performance across multivariate datasets with more sensor channels.

## Full Documentation

See the shared team documentation for full analysis, plots, and comparison results.

## References

- ADTK documentation: https://adtk.readthedocs.io/
- ADTK detector documentation: https://adtk.readthedocs.io/en/stable/api/detectors.html
- Numenta Anomaly Benchmark repository: https://github.com/numenta/NAB
