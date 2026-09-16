"""
Shared Analytics response envelope builder

This module takes already standardised Draft V0.1 alert lists
from the Models and Correlation adapters and packages them into
the final Analytics response consumed by Backend

Important:
- This builder does NOT translate Models output
- This builder does NOT translate Correlation output
- The adapters are responsible for producing Draft V0.1 alerts
- This builder is only responsible for the outer response
"""

from datetime import datetime, timezone
from typing import Any


def _utc_now_iso() -> str:
    """
    Return the current UTC time as an ISO 8601 string ending in Z.

    Example:
        2026-08-18T13:30:00.123456Z
    """
    return (
        datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def build_analytics_response(
    models_alerts: list[dict[str, Any]],
    correlation_alerts: list[dict[str, Any]],
    processed_items: int,
    errors: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Build the final Draft V0.1 Analytics response envelope

    Parameters
    ----------
    models_alerts:
        Already standardised POINTWISE_ANOMALY alerts produced
        by the Models adapter

    correlation_alerts:
        Already standardised CORRELATION_CHANGE alerts produced
        by the Correlation adapter

    processed_items:
        Number of original input rows/items processed by Analytics
        This is supplied by the caller because it cannot be inferred
        correctly from the number of alerts

    errors:
        Optional list of Analytics errors. If no errors are provided,
        an empty list is used

    Returns
    -------
    dict
        Draft V0.1 Analytics response envelope
    """

    # The builder expects alert LISTS from both adapters
    # Translation of raw Models/Correlation results must happen before reaching this function
    if not isinstance(models_alerts, list):
        raise TypeError("models_alerts must be a list.")

    if not isinstance(correlation_alerts, list):
        raise TypeError("correlation_alerts must be a list.")

    # processed_items represents the original amount of data analysed, not the number of alerts generated
    if (
        not isinstance(processed_items, int)
        or isinstance(processed_items, bool)
        or processed_items < 0
    ):
        raise ValueError(
            "processed_items must be a non-negative integer."
        )

    # If no errors were supplied, use the contract-required empty list
    if errors is None:
        errors = []

    if not isinstance(errors, list):
        raise TypeError("errors must be a list.")

    # Combine both already standardised alert sources
    combined_alerts = models_alerts + correlation_alerts

    # For Draft V0.1 we keep status simple:
    # no errors = success
    # 1 or more errors = error
    status = "error" if errors else "success"

    # The envelope builder is the single place responsible for constructing the shared outer Analytics response
    response = {
        "status": status,
        "generated_at": _utc_now_iso(),
        "alerts": combined_alerts,
        "summary": {
            "processed_items": processed_items,
            "alert_count": len(combined_alerts),
        },
        "errors": errors,
    }

    return response



# models_alerts + correlation_alerts
# combined into 1 list
# calculate alert_count
# add processed items
# then add timestamp
# add status/errors
# FINAL json dictionary

# MODELS ADAPTER OUTPUT EXAMPLE 

# [
#   {
#     "timestamp": "2026-08-18T10:00:00Z",
#     "alert_type": "POINTWISE_ANOMALY",
#     "target": {
#       "entity_id": "sensor_node_01",
#       "metrics": ["temperature"]
#     },
#     "method": "IsolationForest",
#     "score": 0.91,
#     "score_metadata": {
#       "type": "raw_anomaly_score",
#       "normalized": false
#     },
#     "severity": null,
#     "message": "Anomaly detected in temperature using IsolationForest.",
#     "time_window": null,
#     "supporting_values": {
#       "runtime_ms": 24.0,
#       "sensor_value": 31.8
#     },
#     "source": {
#       "component": "models"
#     },
#     "alert_id": null
#   }
# ]

# CORRELATION ADAPTER OUTPUT EXAMPLE

# [
#   {
#     "timestamp": "2026-08-18T10:05:00Z",
#     "alert_type": "CORRELATION_CHANGE",
#     "target": {
#       "entity_id": null,
#       "metrics": ["temperature", "pressure"]
#     },
#     "method": "Rolling_Pearson_Correlation",
#     "score": 0.79,
#     "score_metadata": {
#       "type": "absolute_correlation_delta",
#       "normalized": false
#     },
#     "severity": "HIGH",
#     "message": "Correlation between temperature and pressure changed by 0.79.",
#     "time_window": {
#       "start": "2026-08-18T10:00:00Z",
#       "end": "2026-08-18T10:05:00Z",
#       "window_size": 30,
#       "step_size": 5
#     },
#     "supporting_values": {
#       "previous_correlation": 0.91,
#       "current_correlation": 0.12,
#       "delta": 0.79,
#       "window_index": 4
#     },
#     "source": {
#       "component": "correlation"
#     },
#     "alert_id": null
#   }
# ]

# THIS ENVELOPE WILL RETURN THE NEXT JSON RESPONSE:
# ================================================
# {
#   "status": "success",
#   "generated_at": "2026-08-18T13:30:00Z",
#   "alerts": [
#     {
#       "timestamp": "2026-08-18T10:00:00Z",
#       "alert_type": "POINTWISE_ANOMALY",
#       "target": {
#         "entity_id": "sensor_node_01",
#         "metrics": ["temperature"]
#       },
#       "method": "IsolationForest",
#       "score": 0.91,
#       "score_metadata": {
#         "type": "raw_anomaly_score",
#         "normalized": false
#       },
#       "severity": null,
#       "message": "Anomaly detected in temperature using IsolationForest.",
#       "time_window": null,
#       "supporting_values": {
#         "runtime_ms": 24.0,
#         "sensor_value": 31.8
#       },
#       "source": {
#         "component": "models"
#       },
#       "alert_id": null
#     },
#     {
#       "timestamp": "2026-08-18T10:05:00Z",
#       "alert_type": "CORRELATION_CHANGE",
#       "target": {
#         "entity_id": null,
#         "metrics": ["temperature", "pressure"]
#       },
#       "method": "Rolling_Pearson_Correlation",
#       "score": 0.79,
#       "score_metadata": {
#         "type": "absolute_correlation_delta",
#         "normalized": false
#       },
#       "severity": "HIGH",
#       "message": "Correlation between temperature and pressure changed by 0.79.",
#       "time_window": {
#         "start": "2026-08-18T10:00:00Z",
#         "end": "2026-08-18T10:05:00Z",
#         "window_size": 30,
#         "step_size": 5
#       },
#       "supporting_values": {
#         "previous_correlation": 0.91,
#         "current_correlation": 0.12,
#         "delta": 0.79,
#         "window_index": 4
#       },
#       "source": {
#         "component": "correlation"
#       },
#       "alert_id": null
#     }
#   ],
#   "summary": {
#     "processed_items": 100,
#     "alert_count": 2
#   },
#   "errors": []
# }