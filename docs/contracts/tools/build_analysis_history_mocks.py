"""Build and check the Analysis History mock responses (ENG-02).

Run from the repository root:

    python docs/contracts/tools/build_analysis_history_mocks.py

It writes every mock named in docs/contracts/analysis-history-api-contract-v0.1.md
into frontend/src/mocks/analysisHistory/ and then checks that:

1. every stored result passes analytics_validation.response_validator (alert contract V0.1)
2. every alert has a unique UUID alert_id
3. every run summary field matches what can be derived from its result and request
4. the list is ordered newest first and the paging totals add up
5. the latest run equals the first list item

The output is deterministic (fixed UUIDs and timestamps), so running it twice gives
the same files and a clean git diff.
"""

from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from analytics_validation.response_validator import validate_response  # noqa: E402

OUT = ROOT / "frontend" / "src" / "mocks" / "analysisHistory"
NS = uuid.UUID("2b9f6c1e-0d4a-4f7e-9a51-6c3e8d2f1a00")
SEVERITY_ORDER = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
ALERT_TYPES = ("POINTWISE_ANOMALY", "CORRELATION_CHANGE")


def uid(name: str) -> str:
    return str(uuid.uuid5(NS, name))


def anomaly(run: str, n: int, ts: str, metric: str, value: float, score: float) -> dict:
    return {
        "timestamp": ts,
        "alert_type": "POINTWISE_ANOMALY",
        "target": {"entity_id": None, "metrics": [metric]},
        "method": "IsolationForest",
        "score": score,
        "score_metadata": {"type": "raw_anomaly_score", "normalized": False},
        "severity": None,
        "message": f"Anomaly detected in {metric}.",
        "time_window": None,
        "supporting_values": {"sensor_value": value, "runtime_ms": 41},
        "source": {"component": "models"},
        "alert_id": uid(f"{run}/alert/{n}"),
    }


def corr_change(run: str, n: int, start: str, end: str, pair: list, prev: float,
                cur: float, severity: str, window_index: int) -> dict:
    delta = round(abs(prev - cur), 2)
    return {
        "timestamp": end,
        "alert_type": "CORRELATION_CHANGE",
        "target": {"entity_id": None, "metrics": pair},
        "method": "Rolling_Pearson_Correlation",
        "score": delta,
        "score_metadata": {"type": "absolute_correlation_delta", "normalized": False},
        "severity": severity,
        "message": f"Correlation between {pair[0]} and {pair[1]} changed by {delta}.",
        "time_window": {"start": start, "end": end, "window_size": 20, "step_size": 10},
        "supporting_values": {
            "previous_correlation": prev,
            "current_correlation": cur,
            "delta": delta,
            "window_index": window_index,
        },
        "source": {"component": "correlation"},
        "alert_id": uid(f"{run}/alert/{n}"),
    }


def make_run(key: str, dataset_id, dataset_name, deleted: bool, streams: list,
             processed: int, generated_at: str, created_at: str, alerts: list) -> dict:
    request = {
        "model": {"detector": "isolationforest", "metric": streams[0], "parameters": {}},
        "correlation": {"streams": streams, "window_size": 20, "step_size": 10, "method": "pearson"},
    }
    result = {
        "status": "success",
        "generated_at": generated_at,
        "alerts": alerts,
        "summary": {"processed_items": processed, "alert_count": len(alerts)},
        "errors": [],
    }
    severities = [a["severity"] for a in alerts if a["severity"]]
    detail = {
        "id": uid(key),
        "datasetId": dataset_id,
        "datasetName": dataset_name,
        "datasetDeleted": deleted,
        "status": result["status"],
        "streams": streams,
        "modelMetric": streams[0],
        "processedItems": processed,
        "alertCount": len(alerts),
        "alertCountByType": {t: sum(a["alert_type"] == t for a in alerts) for t in ALERT_TYPES},
        "highestSeverity": max(severities, key=SEVERITY_ORDER.get) if severities else None,
        "generatedAt": generated_at,
        "createdAt": created_at,
        "contractVersion": "0.1",
        "request": request,
        "result": result,
    }
    return detail


SUMMARY_KEYS = [
    "id", "datasetId", "datasetName", "datasetDeleted", "status", "streams", "modelMetric",
    "processedItems", "alertCount", "alertCountByType", "highestSeverity", "generatedAt", "createdAt",
]


def summary_of(detail: dict) -> dict:
    return {k: detail[k] for k in SUMMARY_KEYS}


def build() -> dict[str, object]:
    weather = ["temperature", "humidity", "pressure"]

    run_a = make_run(
        "run/a", 42, "melbourne-weather-replay", False, weather, 500,
        "2026-11-21T09:14:58Z", "2026-11-21T09:15:02Z",
        [
            anomaly("run/a", 1, "2026-11-20T14:30:00Z", "temperature", 41.7, 0.1912),
            corr_change("run/a", 2, "2026-11-20T15:10:00Z", "2026-11-20T18:30:00Z",
                        ["temperature", "humidity"], -0.82, -0.11, "HIGH", 12),
            corr_change("run/a", 3, "2026-11-20T19:10:00Z", "2026-11-20T22:30:00Z",
                        ["humidity", "pressure"], 0.64, 0.27, "MEDIUM", 14),
        ],
    )
    run_b = make_run(
        "run/b", 42, "melbourne-weather-replay", False, ["temperature", "humidity"], 500,
        "2026-11-19T03:02:11Z", "2026-11-19T03:02:14Z", [],
    )
    run_c = make_run(
        "run/c", 37, "thingspeak-12397", True, ["temperature", "light_level"], 240,
        "2026-11-17T22:41:05Z", "2026-11-17T22:41:09Z",
        [
            corr_change("run/c", 1, "2026-11-17T08:00:00Z", "2026-11-17T09:40:00Z",
                        ["temperature", "light_level"], 0.58, 0.31, "LOW", 5),
        ],
    )
    runs = [run_a, run_b, run_c]  # newest first

    return {
        "run_latest.json": run_a,
        "run_detail_with_alerts.json": run_a,
        "run_detail_no_alerts.json": run_b,
        "runs_list_page1.json": {
            "items": [summary_of(r) for r in runs],
            "page": 1,
            "pageSize": 20,
            "totalItems": len(runs),
            "totalPages": 1,
        },
        "runs_list_empty.json": {"items": [], "page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0},
        "run_latest_none.json": {"error": "No analysis runs found", "code": "RUN_NOT_FOUND"},
        "error_run_not_found.json": {"error": "Analysis run not found", "code": "RUN_NOT_FOUND"},
        "error_validation.json": {
            "error": "pageSize must be an integer from 1 to 100",
            "code": "VALIDATION_ERROR",
        },
    }


def is_utc(value: str) -> bool:
    try:
        return value.endswith("Z") and datetime.fromisoformat(value.replace("Z", "+00:00")) is not None
    except ValueError:
        return False


def check(mocks: dict) -> list[str]:
    problems: list[str] = []
    details = [mocks[n] for n in ("run_detail_with_alerts.json", "run_detail_no_alerts.json")]
    listing = mocks["runs_list_page1.json"]
    seen_alert_ids: set[str] = set()

    for item in listing["items"]:
        if set(item) != set(SUMMARY_KEYS):
            problems.append(f"summary {item['id']} has wrong keys")
        if not (is_utc(item["createdAt"]) and is_utc(item["generatedAt"])):
            problems.append(f"summary {item['id']} has a non UTC timestamp")

    for d in details + [mocks["run_latest.json"]]:
        # validate_response returns a list of error strings; an empty list means valid.
        errors = validate_response(d["result"])
        if errors:
            problems.append(f"run {d['id']} result fails alert contract V0.1: {errors}")
        r = d["result"]
        checks = {
            "status": d["status"] == r["status"],
            "processedItems": d["processedItems"] == r["summary"]["processed_items"],
            "alertCount": d["alertCount"] == r["summary"]["alert_count"] == len(r["alerts"]),
            "generatedAt": d["generatedAt"] == r["generated_at"],
            "streams": d["streams"] == d["request"]["correlation"]["streams"],
            "modelMetric": d["modelMetric"] == d["request"]["model"]["metric"],
            "byType": sum(d["alertCountByType"].values()) == len(r["alerts"]),
        }
        for name, passed in checks.items():
            if not passed:
                problems.append(f"run {d['id']}: {name} does not match its result")
        for a in r["alerts"]:
            uuid.UUID(a["alert_id"])  # raises if not a UUID

    for d in details:
        for a in d["result"]["alerts"]:
            if a["alert_id"] in seen_alert_ids:
                problems.append(f"duplicate alert_id {a['alert_id']}")
            seen_alert_ids.add(a["alert_id"])
        listed = [i for i in listing["items"] if i["id"] == d["id"]]
        if not listed or listed[0] != summary_of(d):
            problems.append(f"run {d['id']} summary in the list differs from its detail")

    created = [i["createdAt"] for i in listing["items"]]
    if created != sorted(created, reverse=True):
        problems.append("list is not newest first")
    if listing["totalItems"] != len(listing["items"]):
        problems.append("totalItems does not match items")
    if summary_of(mocks["run_latest.json"]) != listing["items"][0]:
        problems.append("latest run is not the first list item")
    return problems


def main() -> int:
    mocks = build()
    OUT.mkdir(parents=True, exist_ok=True)
    for name, body in mocks.items():
        (OUT / name).write_text(json.dumps(body, indent=2) + "\n", encoding="utf-8")
    problems = check(mocks)
    print(f"Wrote {len(mocks)} mock files to {OUT.relative_to(ROOT)}")
    if problems:
        print("FAILED:")
        for p in problems:
            print(f"  {p}")
        return 1
    print("All checks passed: alert contract V0.1, alert_id, summary fields, ordering, paging, latest")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
