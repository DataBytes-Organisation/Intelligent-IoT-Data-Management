
## Isolation Forest contamination testing
##Testing different contamination values across multiple csv files to explore ideal settings

I ran Isolation Forest with different contamination values (0.01, 0.03, 0.05, 0.075, 0.10, 0.15) on 3 tests to see how it affects detection:

## used files
- semisynthetic_contamination_sweep.py
- synthetic_contamination_sweep.py
- nab_realtraffic_contamination_sweep.py


- **Synthetic:** complex.csv with injected anomalies (76 anomalies, 7.5% of the data)
- **Semi-synthetic:** real AWS data (aws_control_merged.csv) with injected anomalies
- **Real labels:** the same AWS data scored against NAB' real anomaly windows (3 sensors, aproxx 21% of the data)

## results


### Synthetic
| Contamination | Precision | Recall | F1 |
|---|---|---|---|
| 0.01 | 1.00 | 0.14 | 0.25 |
| 0.03 | 1.00 | 0.41 | 0.58 |
| 0.05 (current) | 1.00 | 0.67 | 0.80 |
| 0.075 | 1.00 | 1.00 | 1.00 |
| 0.10 | 0.75 | 1.00 | 0.86 |
| 0.15 | 0.50 | 1.00 | 0.67 |

### Semi-synthetic (injected anomalies in real AWS data)
| Contamination | Precision | Recall | F1 |
|---|---|---|---|
| 0.01 | 0.17 | 0.09 | 0.12 |
| 0.03 | 0.13 | 0.21 | 0.16 |
| 0.05 (current) | 0.19 | 0.51 | 0.28 |
| 0.075 | 0.14 | 0.57 | 0.23 |
| 0.10 | 0.12 | 0.63 | 0.20 |
| 0.15 | 0.10 | 0.80 | 0.18 |

### Real labels (AWS, NAB anomaly windows)
| Contamination | Precision | Recall | F1 |
|---|---|---|---|
| 0.01 | 0.66 | 0.03 | 0.06 |
| 0.03 | 0.64 | 0.09 | 0.16 |
| 0.05 (current) | 0.61 | 0.15 | 0.24 |
| 0.075 | 0.48 | 0.17 | 0.26 |
| 0.10 | 0.44 | 0.22 | 0.29 |
| 0.15 | 0.37 | 0.27 | 0.31 |

##what results show
an obvious result is the best contamination setting follows the anomaly rate of the dataset. This is directly seen within the synthetic data, which had an injection rate of 7.5%, when using 0.075 contamination it provided the highest F1 (1.0). 
- often 0.05 is too low to capture enough anomaly values to justify its use, instead increasing this to 0.10 from my test seems more accurate. 
- raising contamination normally reduced precision for better recall.  – no 1 setting best overall. 

##Calibration
- default I iforest_detector contamination value is set to 0.05. this means it flags the same % of readings regardless of how many anomalies actually exist. 
- best setting depends on rate, cant confirm a best set value on live data yet. 

##comments/ possible recommendations
- increase the default 0.05 setting higher to 0.10 as it had a better result on synthetic F1(0.86) and real data F1(0.29). although with this it had lower semi-synthetic results F1(0.20) this still requires more testing to confirm. 
- possibly let contamination value be set manually for data sets or hybrid – users less tech savy have a set value, others may choose to have custom. 
- worth testing the sk_learns contamination=auto 
