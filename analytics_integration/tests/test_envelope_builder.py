"""
Tests for the shared Analytics response envelope builder.

These tests use small Draft V0.1 alert examples rather than
calling the real Models or Correlation pipelines.

Real component integration will be tested later in the AIntl E2E.
"""

# python -m pytest analytics_integration/tests/test_envelope_builder.py -v

import json

from analytics_integration.builders.envelope_builder import (
    build_analytics_response,
)


def sample_models_alert():
    """Return a minimal valid Models Draft V0.1 alert."""
    return {
        "timestamp": "2026-08-18T10:00:00Z",
        "alert_type": "POINTWISE_ANOMALY",
        "target": {
            "entity_id": "sensor_node_01",
            "metrics": ["temperature"],
        },
        "method": "IsolationForest",
        "message": "Anomaly detected in temperature.",
        "source": {
            "component": "models",
        },
    }


def sample_correlation_alert():
    """Return a minimal valid Correlation Draft V0.1 alert."""
    return {
        "timestamp": "2026-08-18T10:05:00Z",
        "alert_type": "CORRELATION_CHANGE",
        "target": {
            "entity_id": "sensor_node_01",
            "metrics": ["temperature", "pressure"],
        },
        "method": "Rolling_Pearson_Correlation",
        "message": (
            "Correlation between temperature and pressure changed."
        ),
        "source": {
            "component": "correlation",
        },
    }


def test_models_only_response():
    """Models alerts should work without Correlation alerts."""

    response = build_analytics_response(
        models_alerts=[sample_models_alert()],
        correlation_alerts=[],
        processed_items=100,
    )

    assert response["status"] == "success"
    assert len(response["alerts"]) == 1
    assert response["alerts"][0]["alert_type"] == "POINTWISE_ANOMALY"

    assert response["summary"]["processed_items"] == 100
    assert response["summary"]["alert_count"] == 1

    assert response["errors"] == []


def test_correlation_only_response():
    """Correlation alerts should work without Models alerts."""

    response = build_analytics_response(
        models_alerts=[],
        correlation_alerts=[sample_correlation_alert()],
        processed_items=100,
    )

    assert response["status"] == "success"
    assert len(response["alerts"]) == 1
    assert response["alerts"][0]["alert_type"] == "CORRELATION_CHANGE"

    assert response["summary"]["alert_count"] == 1


def test_combined_response():
    """Models and Correlation alerts should be combined."""

    response = build_analytics_response(
        models_alerts=[sample_models_alert()],
        correlation_alerts=[sample_correlation_alert()],
        processed_items=100,
    )

    assert response["status"] == "success"

    assert len(response["alerts"]) == 2
    assert response["summary"]["alert_count"] == 2

    assert response["alerts"][0]["alert_type"] == "POINTWISE_ANOMALY"
    assert response["alerts"][1]["alert_type"] == "CORRELATION_CHANGE"


def test_no_alert_response():
    """No detected alerts should still produce a successful response."""

    response = build_analytics_response(
        models_alerts=[],
        correlation_alerts=[],
        processed_items=100,
    )

    assert response["status"] == "success"
    assert response["alerts"] == []

    assert response["summary"]["processed_items"] == 100
    assert response["summary"]["alert_count"] == 0

    assert response["errors"] == []


def test_generated_at_is_utc():
    """generated_at should use the Draft V0.1 UTC Z format."""

    response = build_analytics_response(
        models_alerts=[],
        correlation_alerts=[],
        processed_items=0,
    )

    assert response["generated_at"].endswith("Z")


def test_response_is_json_serializable():
    """Backend must eventually be able to serialize this response as JSON."""

    response = build_analytics_response(
        models_alerts=[sample_models_alert()],
        correlation_alerts=[sample_correlation_alert()],
        processed_items=100,
    )

    # json.dumps raises an exception if something cannot be serialized.
    json.dumps(response)


def test_errors_set_error_status():
    """If errors are supplied, the response status should become error."""

    errors = [
        {
            "code": "ANALYTICS_ERROR",
            "message": "Example Analytics processing error.",
        }
    ]

    response = build_analytics_response(
        models_alerts=[],
        correlation_alerts=[],
        processed_items=0,
        errors=errors,
    )

    assert response["status"] == "error"
    assert response["errors"] == errors


def test_invalid_processed_items():
    """processed_items should never be negative."""

    try:
        build_analytics_response(
            models_alerts=[],
            correlation_alerts=[],
            processed_items=-1,
        )

        assert False, "Expected ValueError"

    except ValueError:
        pass