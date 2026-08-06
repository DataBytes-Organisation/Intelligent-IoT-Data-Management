from typing import Any, Dict, Tuple

from analytics_integration.v1_schema import AnalyticsResponseV1
from analytics_validation.response_validator import validate_response


def create_analytics_response(
    timestamp: str,
    alert_type: str,
    target: str,
    method: str,
    score: float,
    severity: str,
    message: str,
    supporting_values: Dict[str, Any],
) -> Tuple[AnalyticsResponseV1, list[str]]:
    response: AnalyticsResponseV1 = {
        "timestamp": timestamp,
        "alert_type": alert_type,
        "target": target,
        "method": method,
        "score": score,
        "severity": severity,
        "message": message,
        "supporting_values": supporting_values,
    }

    is_valid, errors = validate_response(response)

    if not is_valid:
        return response, errors

    return response, []