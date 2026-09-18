from analytics_validation.response_validator import (
    validate_alert,
    validate_response,
)


def valid_anomaly_alert():
    return {
        "timestamp": "2026-08-05T08:25:00Z",
        "alert_type": "POINTWISE_ANOMALY",
        "target": {
            "entity_id": None,
            "metrics": ["temperature"],
        },
        "method": "IsolationForest",
        "score": 0.1825,
        "score_metadata": {
            "type": "raw_anomaly_score",
            "normalized": False,
        },
        "severity": None,
        "message": "Anomaly detected in temperature.",
        "time_window": None,
        "supporting_values": {
            "sensor_value": 88.5,
            "runtime_ms": 35,
        },
        "source": {
            "component": "models",
        },
        "alert_id": None,
    }


def valid_correlation_alert():
    return {
        "timestamp": "2026-08-05T08:25:00Z",
        "alert_type": "CORRELATION_CHANGE",
        "target": {
            "entity_id": None,
            "metrics": ["temperature", "pressure"],
        },
        "method": "Rolling_Pearson_Correlation",
        "score": 0.79,
        "score_metadata": {
            "type": "absolute_correlation_delta",
            "normalized": False,
        },
        "severity": "HIGH",
        "message": "Correlation between temperature and pressure changed by 0.79.",
        "time_window": {
            "start": "2026-08-05T08:20:00Z",
            "end": "2026-08-05T08:25:00Z",
            "window_size": 30,
            "step_size": 5,
        },
        "supporting_values": {
            "previous_correlation": 0.91,
            "current_correlation": 0.12,
            "delta": 0.79,
            "window_index": 4,
        },
        "source": {
            "component": "correlation",
        },
        "alert_id": None,
    }


def valid_response():
    return {
        "status": "success",
        "generated_at": "2026-08-05T08:30:00Z",
        "alerts": [
            valid_anomaly_alert(),
            valid_correlation_alert(),
        ],
        "summary": {
            "processed_items": 100,
            "alert_count": 2,
        },
        "errors": [],
    }


def test_valid_anomaly_alert():
    errors = validate_alert(valid_anomaly_alert())
    assert errors == []


def test_valid_correlation_alert():
    errors = validate_alert(valid_correlation_alert())
    assert errors == []


def test_valid_shared_response():
    errors = validate_response(valid_response())
    assert errors == []


def test_pointwise_anomaly_type_supported():
    alert = valid_anomaly_alert()
    alert["alert_type"] = "POINTWISE_ANOMALY"

    errors = validate_alert(alert)

    assert errors == []


def test_correlation_change_type_supported():
    alert = valid_correlation_alert()
    alert["alert_type"] = "CORRELATION_CHANGE"

    errors = validate_alert(alert)

    assert errors == []


def test_old_alert_type_rejected():
    alert = valid_anomaly_alert()
    alert["alert_type"] = "anomaly"

    errors = validate_alert(alert)

    assert any("alert_type" in error for error in errors)


def test_missing_required_alert_field():
    alert = valid_anomaly_alert()
    del alert["method"]

    errors = validate_alert(alert)

    assert "method is required" in errors


def test_invalid_timestamp():
    alert = valid_anomaly_alert()
    alert["timestamp"] = "invalid-date"

    errors = validate_alert(alert)

    assert any("timestamp" in error for error in errors)


def test_non_utc_timestamp():
    alert = valid_anomaly_alert()
    alert["timestamp"] = "2026-08-05T08:25:00"

    errors = validate_alert(alert)

    assert any("timestamp" in error for error in errors)


def test_invalid_target_type():
    alert = valid_anomaly_alert()
    alert["target"] = "sensor-001"

    errors = validate_alert(alert)

    assert "target must be an object" in errors


def test_missing_target_metrics():
    alert = valid_anomaly_alert()
    del alert["target"]["metrics"]

    errors = validate_alert(alert)

    assert "target.metrics is required" in errors


def test_empty_target_metrics():
    alert = valid_anomaly_alert()
    alert["target"]["metrics"] = []

    errors = validate_alert(alert)

    assert "target.metrics must not be empty" in errors


def test_invalid_severity():
    alert = valid_correlation_alert()
    alert["severity"] = "CRITICAL"

    errors = validate_alert(alert)

    assert any("severity" in error for error in errors)


def test_null_severity_allowed():
    alert = valid_anomaly_alert()
    alert["severity"] = None

    errors = validate_alert(alert)

    assert errors == []


def test_optional_fields_can_be_omitted():
    alert = valid_anomaly_alert()

    for field in [
        "score",
        "score_metadata",
        "severity",
        "time_window",
        "supporting_values",
        "alert_id",
    ]:
        alert.pop(field, None)

    errors = validate_alert(alert)

    assert errors == []


def test_invalid_source():
    alert = valid_anomaly_alert()
    alert["source"] = "models"

    errors = validate_alert(alert)

    assert "source must be an object" in errors


def test_missing_source_component():
    alert = valid_anomaly_alert()
    alert["source"] = {}

    errors = validate_alert(alert)

    assert "source.component is required" in errors


def test_invalid_time_window_timestamp():
    alert = valid_correlation_alert()
    alert["time_window"]["start"] = "invalid"

    errors = validate_alert(alert)

    assert any("time_window.start" in error for error in errors)


def test_no_alert_response():
    response = {
        "status": "success",
        "generated_at": "2026-08-05T08:30:00Z",
        "alerts": [],
        "summary": {
            "processed_items": 100,
            "alert_count": 0,
        },
        "errors": [],
    }

    errors = validate_response(response)

    assert errors == []


def test_invalid_response_status():
    response = valid_response()
    response["status"] = "invalid"

    errors = validate_response(response)

    assert "status must be success or error" in errors


def test_alerts_must_be_list():
    response = valid_response()
    response["alerts"] = {}

    errors = validate_response(response)

    assert "alerts must be a list" in errors


def test_errors_must_be_list():
    response = valid_response()
    response["errors"] = {}

    errors = validate_response(response)

    assert "errors must be a list" in errors


def test_missing_outer_response_field():
    response = valid_response()
    del response["summary"]

    errors = validate_response(response)

    assert "summary is required" in errors