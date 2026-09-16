from io import BytesIO, StringIO
import logging

import pytest

from correlation_alert import server as server_module
from correlation_alert.server import create_app
from correlation_alert.settings import ServiceSettings


def _payload(delta_threshold):
    return {
        "data": [
            {"time": 1, "sensor_a": 1, "sensor_b": 1},
            {"time": 2, "sensor_a": 2, "sensor_b": 2},
            {"time": 3, "sensor_a": 3, "sensor_b": 3},
            {"time": 4, "sensor_a": 4, "sensor_b": 4},
            {"time": 5, "sensor_a": 5, "sensor_b": 6},
            {"time": 6, "sensor_a": 6, "sensor_b": 5},
        ],
        "timestamp_col": "time",
        "selected_streams": ["sensor_a", "sensor_b"],
        "window_size": 3,
        "step_size": 3,
        "delta_threshold": delta_threshold,
    }


def test_service_status_reports_running_service():
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://correlation.test",
        request_timeout_seconds=12,
        log_level="WARNING",
        log_file=None,
        debug=False,
    )
    client = create_app(service_settings=configured).test_client()

    response = client.get("/service-status")

    body = response.get_json()
    assert response.status_code == 200
    assert body["status"] == "running"
    assert body["service"] == "correlation-alert-api"
    assert body["live"] is True
    assert body["ready"] is True
    assert body["checks"]["dependencies"]["ok"] is True
    assert body["checks"]["pipeline"]["ok"] is True
    assert body["config"] == configured.as_dict()
    assert body["check_duration_ms"] >= 0


def test_service_status_returns_503_when_pipeline_check_fails(monkeypatch):
    def fail_self_test():
        raise RuntimeError("pipeline unavailable")

    monkeypatch.setattr(
        server_module,
        "_run_pipeline_self_test",
        fail_self_test,
    )
    response = create_app().test_client().get("/service-status")

    body = response.get_json()
    assert response.status_code == 503
    assert body["status"] == "degraded"
    assert body["live"] is True
    assert body["ready"] is False
    assert body["checks"]["pipeline"]["ok"] is False


def test_csv_upload_returns_pipeline_response():
    client = create_app().test_client()
    csv_data = b"time,s1,s2\n1,10,20\n2,11,21\n3,12,22\n4,13,23\n"

    response = client.post(
        "/detect-correlation-alert",
        data={
            "file": (BytesIO(csv_data), "sensors.csv"),
            "timestamp_col": "time",
            "selected_streams": "s1,s2",
            "window_size": "2",
            "step_size": "2",
            "method": "pearson",
        },
        content_type="multipart/form-data",
    )

    body = response.get_json()
    assert response.status_code == 200
    assert body["status"] == "success"
    assert len(body["request_id"]) == 8
    assert body["runtime_ms"] >= 0
    assert body["summary"]["processed_rows"] == 4
    assert body["summary"]["windows"] == 2
    assert len(body["correlations"]) == 2
    assert len(body["changes"]) == 1
    assert body["alerts"] == []


def test_api_uses_custom_delta_threshold():
    client = create_app().test_client()

    response = client.post("/detect-correlation-alert", json=_payload(0.6))

    assert response.status_code == 200
    assert response.get_json()["summary"]["alerts"] == 0


@pytest.mark.parametrize("method", ["pearson", "spearman"])
def test_api_accepts_supported_method(method):
    client = create_app().test_client()
    payload = _payload(0.6)
    payload["method"] = method

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 200
    assert response.get_json()["status"] == "success"


def test_invalid_method_returns_400():
    client = create_app().test_client()
    payload = _payload(0.6)
    payload["method"] = "banana"

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 400
    assert response.get_json()["error_type"] == "invalid_input"


def test_invalid_threshold_returns_400():
    client = create_app().test_client()

    response = client.post("/detect-correlation-alert", json=_payload("abc"))

    assert response.status_code == 400
    assert response.get_json()["error_type"] == "invalid_input"


def test_success_log_has_request_metadata_without_raw_sensor_values():
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://correlation.test",
        request_timeout_seconds=30,
        log_level="INFO",
        log_file=None,
        debug=False,
    )
    api_logger = logging.getLogger("correlation.api")
    log_output = StringIO()
    handler = logging.StreamHandler(log_output)
    api_logger.addHandler(handler)

    payload = _payload(0.6)
    payload["data"][0]["sensor_a"] = 987654321
    try:
        response = create_app(service_settings=configured).test_client().post(
            "/detect-correlation-alert",
            json=payload,
        )
    finally:
        api_logger.removeHandler(handler)
        handler.close()

    body = response.get_json()
    log_text = log_output.getvalue()
    assert response.status_code == 200
    assert f"request_id={body['request_id']}" in log_text
    assert "rows_in=6" in log_text
    assert "streams=sensor_a,sensor_b" in log_text
    assert "runtime_ms=" in log_text
    assert "alerts=0" in log_text
    assert "987654321" not in log_text


def test_invalid_request_logs_failure_with_response_request_id():
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://correlation.test",
        request_timeout_seconds=30,
        log_level="INFO",
        log_file=None,
        debug=False,
    )
    api_logger = logging.getLogger("correlation.api")
    log_output = StringIO()
    handler = logging.StreamHandler(log_output)
    api_logger.addHandler(handler)

    payload = _payload(0.6)
    payload["method"] = "banana"
    try:
        response = create_app(service_settings=configured).test_client().post(
            "/detect-correlation-alert",
            json=payload,
        )
    finally:
        api_logger.removeHandler(handler)
        handler.close()

    body = response.get_json()
    log_text = log_output.getvalue()
    assert response.status_code == 400
    assert f"request_id={body['request_id']}" in log_text
    assert "event=failed" in log_text
    assert "error_type=invalid_input" in log_text
    assert "runtime_ms=" in log_text


def test_internal_failure_log_omits_exception_message(monkeypatch):
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://correlation.test",
        request_timeout_seconds=30,
        log_level="INFO",
        log_file=None,
        debug=False,
    )
    api_logger = logging.getLogger("correlation.api")
    log_output = StringIO()
    handler = logging.StreamHandler(log_output)
    api_logger.addHandler(handler)

    def fail_pipeline(**pipeline_arguments):
        raise RuntimeError("private_sensor_value_987654321")

    monkeypatch.setattr(
        server_module,
        "detect_correlation_change_alert",
        fail_pipeline,
    )
    try:
        response = create_app(service_settings=configured).test_client().post(
            "/detect-correlation-alert",
            json=_payload(0.6),
        )
    finally:
        api_logger.removeHandler(handler)
        handler.close()

    body = response.get_json()
    log_text = log_output.getvalue()
    assert response.status_code == 500
    assert f"request_id={body['request_id']}" in log_text
    assert "event=failed" in log_text
    assert "error_type=internal_error" in log_text
    assert "exception=RuntimeError" in log_text
    assert "private_sensor_value_987654321" not in log_text


def test_request_over_timeout_budget_logs_slow_event(monkeypatch):
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://correlation.test",
        request_timeout_seconds=1,
        log_level="INFO",
        log_file=None,
        debug=False,
    )
    measured_times = iter([10.0, 12.0])
    monkeypatch.setattr(
        server_module.time,
        "perf_counter",
        lambda: next(measured_times),
    )
    api_logger = logging.getLogger("correlation.api")
    log_output = StringIO()
    handler = logging.StreamHandler(log_output)
    api_logger.addHandler(handler)

    try:
        response = create_app(service_settings=configured).test_client().post(
            "/detect-correlation-alert",
            json=_payload(0.6),
        )
    finally:
        api_logger.removeHandler(handler)
        handler.close()

    log_text = log_output.getvalue()
    assert response.status_code == 200
    assert response.get_json()["runtime_ms"] == 2000
    assert "event=slow" in log_text
    assert "timeout_seconds=1" in log_text


def test_startup_log_reports_active_operational_settings():
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://correlation.test",
        request_timeout_seconds=25,
        log_level="INFO",
        log_file=None,
        debug=False,
    )
    api_logger = logging.getLogger("correlation.api")
    log_output = StringIO()
    handler = logging.StreamHandler(log_output)
    api_logger.addHandler(handler)

    try:
        server_module.log_startup(api_logger, configured)
    finally:
        api_logger.removeHandler(handler)
        handler.close()

    log_text = log_output.getvalue()
    assert "event=startup" in log_text
    assert "service_url=http://correlation.test" in log_text
    assert "timeout_seconds=25" in log_text
    assert "log_level=INFO" in log_text
