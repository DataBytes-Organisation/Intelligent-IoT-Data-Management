from typing import Any, Dict, Literal, TypedDict

AlertType = Literal["anomaly", "correlation"]
SeverityLevel = Literal["low", "medium", "high", "critical"]


class AnalyticsResponseV1(TypedDict):
    timestamp: str
    alert_type: AlertType
    target: str
    method: str
    score: float
    severity: SeverityLevel
    message: str
    supporting_values: Dict[str, Any]


REQUIRED_FIELDS = (
    "timestamp",
    "alert_type",
    "target",
    "method",
    "score",
    "severity",
    "message",
    "supporting_values",
)

ALERT_TYPES = {
    "anomaly",
    "correlation",
}

SEVERITY_LEVELS = {
    "low",
    "medium",
    "high",
    "critical",
}