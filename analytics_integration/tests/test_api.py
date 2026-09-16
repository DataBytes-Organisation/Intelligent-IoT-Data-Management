"""
[AIntg-003] Analytics Integration API tests
"""

from analytics_integration.api.server import (
    create_app,
)

from analytics_integration.run_mvp_pipeline import (
    load_smoke_dataset,
)

from analytics_validation.response_validator import (
    validate_response,
)


def _build_valid_payload(
    row_limit=120,
):
    df = load_smoke_dataset(
        row_limit=row_limit
    )

    data = (
        df[
            [
                "timestamp",
                "occupancy_t4013",
                "occupancy_6005",
            ]
        ]
        .to_dict(orient="records")
    )

    return {
        "entity_id": "nab_realtraffic",
        "timestamp_col": "timestamp",
        "data": data,
        "model": {
            "detector": (
                "isolationforest"
            ),
            "metric": (
                "occupancy_t4013"
            ),
            "parameters": {},
        },
        "correlation": {
            "streams": [
                "occupancy_t4013",
                "occupancy_6005",
            ],
            "window_size": 20,
            "step_size": 10,
            "method": "pearson",
        },
    }


def _client():
    app = create_app()
    app.config.update(TESTING=True)

    return app.test_client()


def test_health_returns_200():
    client = _client()

    response = client.get(
        "/health"
    )

    assert response.status_code == 200

    body = response.get_json()

    assert body["status"] == "ok"
    assert (
        body["service"]
        == "analytics-integration"
    )


def test_valid_analyze_returns_200():
    client = _client()

    response = client.post(
        "/analytics/analyze",
        json=_build_valid_payload(),
    )

    assert response.status_code == 200


def test_valid_response_passes_contract():
    client = _client()

    response = client.post(
        "/analytics/analyze",
        json=_build_valid_payload(),
    )

    body = response.get_json()

    assert validate_response(body) == []
    assert body["status"] == "success"
    assert (
        body["summary"][
            "processed_items"
        ]
        == 120
    )


def test_models_alerts_can_appear():
    client = _client()

    response = client.post(
        "/analytics/analyze",
        json=_build_valid_payload(),
    )

    body = response.get_json()

    assert any(
        alert["alert_type"]
        == "POINTWISE_ANOMALY"
        for alert in body["alerts"]
    )


def test_both_alert_types_can_appear():
    client = _client()

    response = client.post(
        "/analytics/analyze",
        json=_build_valid_payload(
            row_limit=300
        ),
    )

    body = response.get_json()

    alert_types = {
        alert["alert_type"]
        for alert in body["alerts"]
    }

    assert "POINTWISE_ANOMALY" in alert_types
    assert "CORRELATION_CHANGE" in alert_types


def test_missing_data_returns_400():
    client = _client()

    payload = _build_valid_payload()
    del payload["data"]

    response = client.post(
        "/analytics/analyze",
        json=payload,
    )

    assert response.status_code == 400
    assert (
        response.get_json()["status"]
        == "error"
    )


def test_empty_data_returns_400():
    client = _client()

    payload = _build_valid_payload()
    payload["data"] = []

    response = client.post(
        "/analytics/analyze",
        json=payload,
    )

    assert response.status_code == 400


def test_unknown_model_metric_returns_400():
    client = _client()

    payload = _build_valid_payload()

    payload["model"]["metric"] = (
        "does_not_exist"
    )

    response = client.post(
        "/analytics/analyze",
        json=payload,
    )

    assert response.status_code == 400


def test_fewer_than_two_streams_returns_400():
    client = _client()

    payload = _build_valid_payload()

    payload["correlation"][
        "streams"
    ] = [
        "occupancy_t4013"
    ]

    response = client.post(
        "/analytics/analyze",
        json=payload,
    )

    assert response.status_code == 400


def test_invalid_correlation_method_returns_400():
    client = _client()

    payload = _build_valid_payload()

    payload["correlation"][
        "method"
    ] = "invalid-method"

    response = client.post(
        "/analytics/analyze",
        json=payload,
    )

    assert response.status_code == 400