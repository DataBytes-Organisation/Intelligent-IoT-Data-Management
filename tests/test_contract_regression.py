from analytics_validation.response_validator import validate_response


def valid_response():
    return {
        "status": "success",
        "generated_at": "2026-08-25T10:00:00Z",
        "alerts": [],
        "summary": {
            "processed_items": 0,
            "alert_count": 0
        },
        "errors": []
    }


def valid_alert():
    return {
        "timestamp": "2026-08-25T10:00:00Z",
        "alert_type": "POINTWISE_ANOMALY",
        "target": {
            "entity_id": "sensor_01",
            "metrics": ["temperature"]
        },
        "method": "z_score",
        "message": "Anomaly detected",
        "source": {
            "component": "models"
        },
        "severity": "HIGH"
    }


def test_valid_contract_response():
    response = valid_response()
    errors = validate_response(response)
    assert errors == []


def test_missing_status_field():
    response = valid_response()
    del response["status"]

    errors = validate_response(response)

    assert "status is required" in errors


def test_missing_generated_at_field():
    response = valid_response()
    del response["generated_at"]

    errors = validate_response(response)

    assert "generated_at is required" in errors


def test_missing_alerts_field():
    response = valid_response()
    del response["alerts"]

    errors = validate_response(response)

    assert "alerts is required" in errors


def test_missing_summary_field():
    response = valid_response()
    del response["summary"]

    errors = validate_response(response)

    assert "summary is required" in errors


def test_missing_errors_field():
    response = valid_response()
    del response["errors"]

    errors = validate_response(response)

    assert "errors is required" in errors


def test_status_wrong_type():
    response = valid_response()
    response["status"] = 123

    errors = validate_response(response)

    assert len(errors) > 0


def test_generated_at_wrong_type():
    response = valid_response()
    response["generated_at"] = 123

    errors = validate_response(response)

    assert len(errors) > 0


def test_invalid_timestamp():
    response = valid_response()
    response["generated_at"] = "invalid-timestamp"

    errors = validate_response(response)

    assert len(errors) > 0


def test_alerts_wrong_type():
    response = valid_response()
    response["alerts"] = "not-a-list"

    errors = validate_response(response)

    assert len(errors) > 0


def test_summary_wrong_type():
    response = valid_response()
    response["summary"] = "not-an-object"

    errors = validate_response(response)

    assert len(errors) > 0


def test_errors_wrong_type():
    response = valid_response()
    response["errors"] = "not-a-list"

    errors = validate_response(response)

    assert len(errors) > 0


def test_valid_severity():
    response = valid_response()
    response["alerts"] = [valid_alert()]

    errors = validate_response(response)

    assert errors == []


def test_invalid_severity():
    response = valid_response()

    alert = valid_alert()
    alert["severity"] = "EXTREME"

    response["alerts"] = [alert]

    errors = validate_response(response)

    assert len(errors) > 0

def test_correlation_change_alert():
    response = valid_response()

    alert = valid_alert()
    alert["alert_type"] = "CORRELATION_CHANGE"
    alert["source"] = {
        "component": "correlation"
    }

    response["alerts"] = [alert]

    errors = validate_response(response)

    assert errors == []


def test_null_severity_allowed():
    response = valid_response()

    alert = valid_alert()
    alert["severity"] = None

    response["alerts"] = [alert]

    errors = validate_response(response)

    assert errors == []