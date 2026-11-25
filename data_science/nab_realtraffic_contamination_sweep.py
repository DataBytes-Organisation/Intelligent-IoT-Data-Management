from preprocessor import load_and_prepare
from nab_loader import load_nab_labels
from detectors.iforest_detector import IsolationForestDetector
from evaluator import evaluate
# real data usage no injected anomalies
# load the real aws data
df, _ = load_and_prepare("../datasets/nab_realtraffic/aws_control_merged.csv")

#load the real anomaly labels for each of the 3 sensors and combine them
LABELS = "../datasets/nab_realtraffic/labels_subset.json"
streams = [
    "realAWSCloudwatch/ec2_cpu_utilization_825cc2.csv",

    "realAWSCloudwatch/ec2_network_in_257a54.csv",
    "realAWSCloudwatch/elb_request_count_8c0756.csv",
]
labels = None
for s in streams:
    l = load_nab_labels(data_index=df.index, labels_file=LABELS, dataset_key=s)
    labels = l if labels is None else (labels | l)

# print anomaly rate
print("anomaly rate:", labels.mean())

# try each contamination value and print
for c in [0.01, 0.03, 0.05, 0.075, 0.10, 0.15]:
    output = IsolationForestDetector(contamination=c).detect(df)
    r = evaluate(output, labels)
    print(c, "precision:", round(r["precision"], 2), "recall:", round(r["recall"], 2), "f1:", round(r["f1"], 2))