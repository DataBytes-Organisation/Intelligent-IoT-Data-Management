import csv
import json
import statistics
import subprocess
from collections import Counter
from pathlib import Path

URL = "http://127.0.0.1:5001/detect-correlation-alert"
SCRIPT_DIRECTORY = Path(__file__).resolve().parent
REPOSITORY_ROOT = SCRIPT_DIRECTORY.parents[4]
DATASET = REPOSITORY_ROOT / "datasets/nab_realtraffic/traffic_4stream_merged.csv"
REPETITIONS = 3

CONFIGURATIONS = [
    ("pearson", 20, 10),
    ("spearman", 20, 10),
    ("pearson", 40, 20),
    ("spearman", 40, 20),
    ("pearson", 60, 30),
    ("spearman", 60, 30),
]

OUTPUT_DIRECTORY = SCRIPT_DIRECTORY.parent / "generated"
EVIDENCE_DIRECTORY = OUTPUT_DIRECTORY / "raw_responses"
EVIDENCE_DIRECTORY.mkdir(parents=True, exist_ok=True)


def send_request(method: str, window: int, step: int):
    """Send one API request and return HTTP code, runtime and JSON response."""

    command = [
        "curl",
        "-sS",
        "-w",
        "\n__METRICS__:%{http_code},%{time_total}",
        "-X",
        "POST",
        URL,
        "-F",
        f"file=@{DATASET}",
        "-F",
        "timestamp_col=timestamp",
        "-F",
        "selected_streams=occupancy_t4013,speed_t4013,occupancy_6005,speed_6005",
        "-F",
        f"window_size={window}",
        "-F",
        f"step_size={step}",
        "-F",
        f"method={method}",
    ]

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )

    marker = "\n__METRICS__:"

    if marker not in completed.stdout:
        return "000", 0.0, {
            "status": "error",
            "error": completed.stderr.strip() or "No HTTP response",
        }

    response_body, metrics = completed.stdout.rsplit(marker, 1)

    try:
        http_code, runtime_text = metrics.strip().split(",", 1)
        runtime_seconds = float(runtime_text)
    except ValueError:
        http_code = "000"
        runtime_seconds = 0.0

    try:
        response_data = json.loads(response_body)
    except json.JSONDecodeError:
        response_data = {
            "status": "error",
            "error": "Response was not valid JSON",
            "raw_response": response_body[:500],
        }

    return http_code, runtime_seconds, response_data


final_rows = []
individual_run_rows = []

for method, window, step in CONFIGURATIONS:
    print()
    print("=" * 70)
    print(
        f"Testing method={method}, "
        f"window_size={window}, step_size={step}"
    )
    print("=" * 70)

    outcomes = []

    for repetition in range(1, REPETITIONS + 1):
        http_code, runtime_seconds, response_data = send_request(
            method,
            window,
            step,
        )

        json_status = response_data.get("status", "unknown")
        error_message = (
            response_data.get("error")
            or response_data.get("message")
            or ""
        )

        success = (
            http_code == "200"
            and json_status == "success"
        )

        outcomes.append(
            {
                "http_code": http_code,
                "runtime_seconds": runtime_seconds,
                "data": response_data,
                "success": success,
            }
        )

        individual_run_rows.append(
            {
                "method": method,
                "window_size": window,
                "step_size": step,
                "repetition": repetition,
                "http_code": http_code,
                "json_status": json_status,
                "runtime_ms": round(runtime_seconds * 1000, 3),
                "error": error_message,
            }
        )

        print(
            f"Run {repetition}: "
            f"HTTP {http_code} | "
            f"JSON status={json_status} | "
            f"Runtime={runtime_seconds * 1000:.3f} ms"
        )

        if error_message:
            print(f"  Error: {error_message}")

    successful_outcomes = [
        outcome
        for outcome in outcomes
        if outcome["success"]
    ]

    if successful_outcomes:
        representative_data = successful_outcomes[-1]["data"]
    else:
        representative_data = outcomes[-1]["data"]

    evidence_filename = (
        EVIDENCE_DIRECTORY
        / f"{method}_w{window}_s{step}.json"
    )

    with evidence_filename.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(representative_data, file, indent=2)

    all_runtimes = [
        outcome["runtime_seconds"]
        for outcome in outcomes
    ]

    average_runtime_ms = round(
        statistics.mean(all_runtimes) * 1000,
        3,
    )

    http_codes = "|".join(
        outcome["http_code"]
        for outcome in outcomes
    )

    row = {
        "method": method.capitalize(),
        "window_size": window,
        "step_size": step,
        "status": "",
        "windows": "N/A",
        "alerts": "N/A",
        "low": "N/A",
        "medium": "N/A",
        "high": "N/A",
        "average_runtime_ms": average_runtime_ms,
        "runtime_interpretation": "",
        "http_codes": http_codes,
        "notes": "",
    }

    if successful_outcomes:
        alerts = representative_data.get("alerts", [])

        severity_counts = Counter(
            str(
                alert.get(
                    "alert_level",
                    alert.get("severity", "UNKNOWN"),
                )
            ).upper()
            for alert in alerts
        )

        summary = representative_data.get("summary", {})

        row.update(
            {
                "status": "SUCCESS",
                "windows": summary.get("windows", 0),
                "alerts": len(alerts),
                "low": severity_counts.get("LOW", 0),
                "medium": severity_counts.get("MEDIUM", 0),
                "high": severity_counts.get("HIGH", 0),
                "runtime_interpretation": (
                    "Average successful processing runtime"
                ),
            }
        )
    else:
        last_http_code = outcomes[-1]["http_code"]

        row["status"] = f"FAILED (HTTP {last_http_code})"
        row["runtime_interpretation"] = (
            "Average time to failure; not successful processing runtime"
        )
        row["notes"] = (
            representative_data.get("error")
            or representative_data.get("message")
            or "Unknown API failure"
        )

    final_rows.append(row)


with (OUTPUT_DIRECTORY / "CCA108_runtime_runs.csv").open(
    "w",
    newline="",
    encoding="utf-8",
) as file:
    writer = csv.DictWriter(
        file,
        fieldnames=individual_run_rows[0].keys(),
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(individual_run_rows)


with (OUTPUT_DIRECTORY / "CCA108_final_results.csv").open(
    "w",
    newline="",
    encoding="utf-8",
) as file:
    writer = csv.DictWriter(
        file,
        fieldnames=final_rows[0].keys(),
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(final_rows)


print()
print("=" * 118)
print("FINAL CONFIGURATION RESULTS")
print("=" * 118)

print(
    f"{'Method':<10}"
    f"{'Window':>8}"
    f"{'Step':>7}"
    f"{'Status':>20}"
    f"{'Windows':>10}"
    f"{'Alerts':>9}"
    f"{'LOW':>7}"
    f"{'MEDIUM':>9}"
    f"{'HIGH':>7}"
    f"{'Avg ms':>11}"
)

print("-" * 118)

for row in final_rows:
    print(
        f"{row['method']:<10}"
        f"{row['window_size']:>8}"
        f"{row['step_size']:>7}"
        f"{row['status']:>20}"
        f"{str(row['windows']):>10}"
        f"{str(row['alerts']):>9}"
        f"{str(row['low']):>7}"
        f"{str(row['medium']):>9}"
        f"{str(row['high']):>7}"
        f"{str(row['average_runtime_ms']):>11}"
    )

    if row["notes"]:
        print(f"  Note: {row['notes']}")


print()
print("Created:")
print(f"  {OUTPUT_DIRECTORY / 'CCA108_final_results.csv'}")
print(f"  {OUTPUT_DIRECTORY / 'CCA108_runtime_runs.csv'}")
print(f"  {EVIDENCE_DIRECTORY}/")
