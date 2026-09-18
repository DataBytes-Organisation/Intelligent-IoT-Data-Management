from datetime import datetime

REQUIRED_ALERT_FIELDS = [
    "timestamp",
    "alert_type",
    "target",
    "method",
    "message",
    "source",
]

OPTIONAL_ALERT_FIELDS = [
    "score",
    "score_metadata",
    "severity",
    "time_window",
    "supporting_values",
    "alert_id",
]

ALERT_TYPES = {
    "POINTWISE_ANOMALY",
    "CORRELATION_CHANGE",
}

SEVERITY_LEVELS = {
    "LOW",
    "MEDIUM",
    "HIGH",
}


def is_iso8601_utc(value):
    if not isinstance(value, str):
        return False

    if not value.endswith("Z"):
        return False

    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def validate_target(target):
    errors = []

    if not isinstance(target, dict):
        return ["target must be an object"]

    if "entity_id" not in target:
        errors.append("target.entity_id is required")

    if "metrics" not in target:
        errors.append("target.metrics is required")
    elif not isinstance(target["metrics"], list):
        errors.append("target.metrics must be a list")
    elif len(target["metrics"]) == 0:
        errors.append("target.metrics must not be empty")
    elif not all(isinstance(metric, str) for metric in target["metrics"]):
        errors.append("target.metrics must contain only strings")

    entity_id = target.get("entity_id")

    if entity_id is not None and not isinstance(entity_id, str):
        errors.append("target.entity_id must be a string or null")

    return errors


def validate_source(source):
    errors = []

    if not isinstance(source, dict):
        return ["source must be an object"]

    if "component" not in source:
        errors.append("source.component is required")
    elif not isinstance(source["component"], str):
        errors.append("source.component must be a string")
    elif not source["component"].strip():
        errors.append("source.component must not be empty")

    return errors


def validate_time_window(time_window):
    errors = []

    if time_window is None:
        return errors

    if not isinstance(time_window, dict):
        return ["time_window must be an object or null"]

    for field in ["start", "end"]:
        if field in time_window:
            if not is_iso8601_utc(time_window[field]):
                errors.append(
                    f"time_window.{field} must be a valid ISO 8601 UTC timestamp"
                )

    for field in ["window_size", "step_size"]:
        if field in time_window:
            value = time_window[field]
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                errors.append(f"time_window.{field} must be numeric")

    return errors


def validate_alert(alert):
    errors = []

    if not isinstance(alert, dict):
        return ["alert must be an object"]

    for field in REQUIRED_ALERT_FIELDS:
        if field not in alert:
            errors.append(f"{field} is required")

    if errors:
        return errors

    if not is_iso8601_utc(alert["timestamp"]):
        errors.append("timestamp must be a valid ISO 8601 UTC timestamp")

    if alert["alert_type"] not in ALERT_TYPES:
        errors.append(
            "alert_type must be POINTWISE_ANOMALY or CORRELATION_CHANGE"
        )

    errors.extend(validate_target(alert["target"]))

    if not isinstance(alert["method"], str):
        errors.append("method must be a string")
    elif not alert["method"].strip():
        errors.append("method must not be empty")

    if not isinstance(alert["message"], str):
        errors.append("message must be a string")
    elif not alert["message"].strip():
        errors.append("message must not be empty")

    errors.extend(validate_source(alert["source"]))

    if "score" in alert:
        score = alert["score"]
        if score is not None and (
            not isinstance(score, (int, float)) or isinstance(score, bool)
        ):
            errors.append("score must be numeric or null")

    if "score_metadata" in alert:
        score_metadata = alert["score_metadata"]
        if score_metadata is not None and not isinstance(score_metadata, dict):
            errors.append("score_metadata must be an object or null")

    if "severity" in alert:
        severity = alert["severity"]
        if severity is not None and severity not in SEVERITY_LEVELS:
            errors.append("severity must be LOW, MEDIUM, HIGH or null")

    if "time_window" in alert:
        errors.extend(validate_time_window(alert["time_window"]))

    if "supporting_values" in alert:
        supporting_values = alert["supporting_values"]
        if supporting_values is not None and not isinstance(
            supporting_values, dict
        ):
            errors.append("supporting_values must be an object or null")

    if "alert_id" in alert:
        alert_id = alert["alert_id"]
        if alert_id is not None and not isinstance(alert_id, str):
            errors.append("alert_id must be a string or null")

    return errors


def validate_response(response):
    errors = []

    if not isinstance(response, dict):
        return ["response must be an object"]

    required_response_fields = [
        "status",
        "generated_at",
        "alerts",
        "summary",
        "errors",
    ]

    for field in required_response_fields:
        if field not in response:
            errors.append(f"{field} is required")

    if errors:
        return errors

    if response["status"] not in {"success", "error"}:
        errors.append("status must be success or error")

    if not is_iso8601_utc(response["generated_at"]):
        errors.append("generated_at must be a valid ISO 8601 UTC timestamp")

    if not isinstance(response["alerts"], list):
        errors.append("alerts must be a list")
    else:
        for index, alert in enumerate(response["alerts"]):
            alert_errors = validate_alert(alert)

            for error in alert_errors:
                errors.append(f"alerts[{index}].{error}")

    if not isinstance(response["summary"], dict):
        errors.append("summary must be an object")
    else:
        summary = response["summary"]

        if "processed_items" not in summary:
            errors.append("summary.processed_items is required")
        elif not isinstance(summary["processed_items"], int):
            errors.append("summary.processed_items must be an integer")

        if "alert_count" not in summary:
            errors.append("summary.alert_count is required")
        elif not isinstance(summary["alert_count"], int):
            errors.append("summary.alert_count must be an integer")

    if not isinstance(response["errors"], list):
        errors.append("errors must be a list")

    return errors