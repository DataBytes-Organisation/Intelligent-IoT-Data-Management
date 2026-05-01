import sys
import pandas as pd
from preprocessor import load_and_prepare
from detectors.adtk_pcaad import PcaADDetector
from detectors.ocsvm_detector import OCSVMDetector
from detectors.iforest_detector import IsolationForestDetector
# from detectors.levelshiftad import LevelShiftAD
from anomaly_injector import inject_point_spikes, inject_all
from evaluator import evaluate

def run_pipeline(filepath, benchmark_mode=False):
    print(f"[pipeline] Loading data from: {filepath}")
    df, scaler = load_and_prepare(filepath)
    print(f"[pipeline] Shape following preprocessor acting: {df.shape}")
    print(f"[pipeline] Columns {list(df.columns)}")
    print(f"[pipeline] preview/check\n{df.head()}\n")

    # Optionally inject synthetic anomalies for scoring
    labels = None
    if benchmark_mode:
        print("[pipeline] Benchmark mode ON — injecting synthetic anomalies")

        # inject all kind of tests
        df, labels = inject_all(df)
        print(f"[pipeline] Injected {labels.sum()} anomalies")


    # DETECTOR
    detectors = [
        PcaADDetector(),
        OCSVMDetector(nu=0.05),
        IsolationForestDetector(contamination=0.05),
        #LevelShiftAD(),
    ]
    # Link the detectors we implement below so others can draw on them if need be.
    # if theres any requirements for your detector maybe note it here as well.

    results = {}
    for detector in detectors:
        name = type(detector).__name__
        print(f"[pipeline] Running: {name}")
        results[name] = detector.detect(df)

    if not detectors:
        print("[pipeline] preprocessing works")

    # extract this into report.py
    # prints summary so we see results when pipeline runs
    for name, output in results.items():
        flags = output['anomaly_flag']
        n_anom = flags.sum()
        print(f"\n[pipeline] {output['model_name']} results:")
        print(f"  Flagged: {n_anom}/{len(flags)} ({n_anom/len(flags)*100:.1f}%)")
        if 'score' in output and 'runtime' in output:
            print(f"  Runtime: {output['runtime']:.3f}s")
            print(f"  Top 5 most anomalous timestamps:")
            top5 = output['score'].nlargest(5)
            print(top5.to_string())



    # Score against ground truth if benchmark mode is on
    if benchmark_mode and labels is not None:
        from sklearn.metrics import confusion_matrix, classification_report, accuracy_score

        eval_rows = [evaluate(output, labels) for output in results.values()]
        eval_df = pd.DataFrame(eval_rows)
        print("\n[pipeline] Benchmark Results (Precision / Recall / F1):")
        print(eval_df.to_string(index=False))

        # Per-detector detailed report (Isolation Forest Only)
        for name, output in results.items():
            if output['model_name'] == "IsolationForest":
                preds = output['anomaly_flag'].reindex(labels.index, fill_value=False).astype(int)
                y_true = labels.astype(int)

                acc = accuracy_score(y_true, preds)
                cm = confusion_matrix(y_true, preds, labels=[0, 1])
                tn, fp, fn, tp = cm.ravel()

                print(f"\n{'='*55}")
                print(f"   {output['model_name']}  —  Accuracy: {acc:.4f} ({acc*100:.2f}%)")
                print(f"{'='*55}")
                print(f"   Confusion Matrix:")
                print(f"                    Predicted")
                print(f"                 Normal  Anomaly")
                print(f"  Actual Normal  {tn:>6}   {fp:>6}")
                print(f"  Actual Anomaly {fn:>6}   {tp:>6}")
                print(f"  TN={tn}  FP={fp}  FN={fn}  TP={tp}")
                print(f"\n   Classification Report:")
                print(classification_report(y_true, preds, target_names=["Normal", "Anomaly"], zero_division=0))

    return df, scaler, results

if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "datasets/complex.csv"
    benchmark = "--benchmark" in sys.argv
    run_pipeline(filepath, benchmark_mode=benchmark)