from preprocessor import load_and_prepare
from anomaly_injector import inject_all
from detectors.iforest_detector import IsolationForestDetector
from evaluator import evaluate

# load n test data and add the fake anomalies - semi-synthetic test
df, _ = load_and_prepare("../datasets/nab_realtraffic/aws_control_merged.csv")
df, labels = inject_all(df)

# try each contamination value and print
print((labels != "normal").mean())
for c in [0.01, 0.03, 0.05, 0.075, 0.10, 0.15]:

    output = IsolationForestDetector(contamination=c).detect(df)
    r = evaluate(output, labels)
    print(c, "precision:", round(r["precision"], 2), "recall:", round(r["recall"], 2), "f1:", round(r["f1"], 2))
    