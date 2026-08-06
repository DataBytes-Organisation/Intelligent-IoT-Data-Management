from datetime import datetime

from analytics_integration.v1_schema import (
    ALERT_TYPES,
    REQUIRED_FIELDS,
    SEVERITY_LEVELS,
)


def is_iso8601(value):
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except (AttributeError, TypeError, ValueError):
        return False


def validate_response(response):
    errors = []

    if not isinstance(response, dict):
        return False, ["Response must be an object"]

    for field in REQUIRED_FIELDS:
        if field not in response:
            errors.append(f"Missing required field: {field}")

    if "timestamp" in response:
        if not isinstance(response["timestamp"], str):
            errors.append("timestamp must be a string")
        elif not is_iso8601(response["timestamp"]):
            errors.append("Invalid ISO 8601 timestamp")

    if "alert_type" in response:
        if not isinstance(response["alert_type"], str):
            errors.append("alert_type must be a string")
        elif response["alert_type"] not in ALERT_TYPES:
            errors.append(
                f"Unsupported alert type: {response['alert_type']}"
            )

    if "target" in response:
        if not isinstance(response["target"], str):
            errors.append("target must be a string")
        elif not response["target"].strip():
            errors.append("target must not be empty")

    if "method" in response:
        if not isinstance(response["method"], str):
            errors.append("method must be a string")
        elif not response["method"].strip():
            errors.append("method must not be empty")

    if "score" in response:
        if isinstance(response["score"], bool) or not isinstance(
            response["score"], (int, float)
        ):
            errors.append("score must be numeric")

    if "severity" in response:
        if not isinstance(response["severity"], str):
            errors.append("severity must be a string")
        elif response["severity"] not in SEVERITY_LEVELS:
            errors.append(
                f"Unsupported severity: {response['severity']}"
            )

    if "message" in response:
        if not isinstance(response["message"], str):
            errors.append("message must be a string")
        elif not response["message"].strip():
            errors.append("message must not be empty")

    if "supporting_values" in response:
        if not isinstance(response["supporting_values"], dict):
            errors.append("supporting_values must be an object")

    return len(errors) == 0, errors