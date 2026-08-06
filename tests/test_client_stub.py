from analytics_integration.client_stub import create_analytics_response


def test_create_valid_anomaly_response():
    response, errors = create_analytics_response(
        timestamp="2026-08-06T10:30:00Z",
        alert_type="anomaly",
        target="sensor_01",
        method="isolation_forest",
        score=0.92,
        severity="high",
        message="Anomaly detected",
        supporting_values={
            "observed_value": 38.5,
            "threshold": 30.0,
        },
    )

    assert errors == []
    assert response["alert_type"] == "anomaly"
    assert response["target"] == "sensor_01"


def test_create_valid_correlation_response():
    response, errors = create_analytics_response(
        timestamp="2026-08-06T10:35:00Z",
        alert_type="correlation",
        target="sensor_01,sensor_02",
        method="pearson",
        score=0.87,
        severity="medium",
        message="Strong correlation detected",
        supporting_values={
            "sensor_1": "sensor_01",
            "sensor_2": "sensor_02",
            "window_size": 30,
        },
    )

    assert errors == []
    assert response["alert_type"] == "correlation"
    assert response["method"] == "pearson"


def test_create_invalid_response():
    response, errors = create_analytics_response(
        timestamp="invalid-date",
        alert_type="unsupported",
        target="sensor_01",
        method="test_method",
        score=0.50,
        severity="extreme",
        message="Invalid response",
        supporting_values={},
    )

    assert response["alert_type"] == "unsupported"
    assert "Invalid ISO 8601 timestamp" in errors
    assert "Unsupported alert type: unsupported" in errors
    assert "Unsupported severity: extreme" in errors