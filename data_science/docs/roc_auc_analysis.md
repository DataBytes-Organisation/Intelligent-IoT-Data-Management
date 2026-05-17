# ROC-AUC Evaluation and Interpretation

## Overview

The ROC-AUC evaluation was conducted to compare the anomaly detection performance of multiple detectors on the synthetic IoT benchmark dataset. In addition to Precision, Recall, and F1-score, the Receiver Operating Characteristic (ROC) curve and Area Under the Curve (AUC) metrics were used to evaluate how effectively each detector distinguishes anomalous behaviour from normal system activity.

The ROC curve visualises the relationship between the True Positive Rate (TPR) and False Positive Rate (FPR) across different classification thresholds. A detector with a curve closer to the top-left corner indicates stronger anomaly discrimination capability. The AUC score summarises this behaviour into a single value between 0 and 1. Higher AUC values indicate better overall detection performance.

## Results Summary

| Detector | ROC-AUC |
|----------|----------|
| OCSVMDetector | 0.785 |
| LevelShiftADDetector | 0.656 |
| VolatilityShiftAD | 0.691 |
| QuantileADDetector | 0.500 |
| ECODDetector | 0.934 |
| COPODDetector | 0.915 |

The results show that the ECODDetector achieved the highest ROC-AUC score of 0.934, followed closely by the COPODDetector with an AUC of 0.915. These detectors demonstrated strong capability in separating anomalous observations from normal behaviour while maintaining lower false positive rates. Their ROC curves remained consistently closer to the ideal top-left region, indicating reliable anomaly ranking performance across multiple thresholds.

The OCSVMDetector achieved moderate performance with an AUC of 0.785, showing acceptable anomaly discrimination but with a higher tendency toward false positives compared to ECOD and COPOD. LevelShiftADDetector and VolatilityShiftAD produced lower AUC scores, indicating weaker overall classification consistency on the injected anomaly patterns.

QuantileADDetector achieved an AUC score close to 0.500, which is approximately equivalent to random classification performance. This suggests that the detector struggled to distinguish between normal and anomalous behaviour within the benchmark dataset.

## Interpretation for Real IoT Systems

In real IoT environments, anomaly detection systems must accurately identify abnormal behaviour while minimising false alarms. High false positive rates can overload monitoring systems and reduce operational trust in alerts. Therefore, detectors with higher ROC-AUC scores are generally preferred because they maintain stronger detection sensitivity across different threshold settings.

Based on the benchmark results, ECODDetector and COPODDetector are the most suitable candidates for deployment in real-world IoT anomaly detection scenarios. Their higher AUC scores indicate better reliability, stronger anomaly separation capability, and more stable detection behaviour under varying operating conditions.