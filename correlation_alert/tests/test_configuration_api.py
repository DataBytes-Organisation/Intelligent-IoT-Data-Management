import pytest

from correlation_alert.server import create_app


def _payload(row_count=40):
    return {
        "data": [
            {
                "time": index,
                "sensor_a": index,
                "sensor_b": index * 2,
            }
            for index in range(row_count)
        ],
        "timestamp_col": "time",
        "selected_streams": ["sensor_a", "sensor_b"],
    }


@pytest.fixture
def client():
    return create_app().test_client()


def test_api_returns_documented_correlation_defaults(client):

    response = client.post(
        "/detect-correlation-alert",
        json=_payload(),
    )

    assert response.status_code == 200
    assert response.get_json()["configuration"] == {
        "window_size": 20,
        "step_size": 10,
        "method": "pearson",
        "strong_corr_threshold": 0.7,
        "weak_corr_threshold": 0.4,
        "delta_threshold": 0.3,
    }


def test_api_accepts_signed_correlation_threshold_boundaries(client):
    payload = _payload()
    payload["strong_corr_threshold"] = 1
    payload["weak_corr_threshold"] = -1
    response = client.post(
        "/detect-correlation-alert",
        json=payload,
    )

    assert response.status_code == 200
    assert response.get_json()["configuration"]["strong_corr_threshold"] == 1
    assert response.get_json()["configuration"]["weak_corr_threshold"] == -1


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("window_size", 0),
        ("window_size", -1),
        ("window_size", 1.5),
        ("window_size", "abc"),
        ("step_size", 0),
        ("step_size", -1),
        ("step_size", 1.5),
        ("step_size", "abc"),
        ("strong_corr_threshold", 1.1),
        ("strong_corr_threshold", -1.1),
        ("strong_corr_threshold", "nan"),
        ("weak_corr_threshold", 1.1),
        ("weak_corr_threshold", -1.1),
        ("weak_corr_threshold", "nan"),
        ("delta_threshold", -0.1),
        ("delta_threshold", 2.1),
        ("delta_threshold", "nan"),
    ],
)
def test_api_rejects_invalid_configuration(client, field, value):
    payload = _payload()
    payload[field] = value

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 400
    assert response.get_json()["error_type"] == "invalid_input"


def test_api_requires_weak_threshold_below_strong_threshold(client):
    payload = _payload()
    payload["strong_corr_threshold"] = 0.4
    payload["weak_corr_threshold"] = 0.7

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 400
    assert "weak_corr_threshold" in response.get_json()["message"]


@pytest.mark.parametrize("delta_threshold", [0, 1.1, 2])
def test_api_accepts_valid_delta_threshold(client, delta_threshold):
    payload = _payload()
    payload["delta_threshold"] = delta_threshold

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 200
    assert response.get_json()["configuration"]["delta_threshold"] == delta_threshold


def test_api_returns_custom_configuration(client):
    payload = _payload()
    payload.update(
        {
            "window_size": 30,
            "step_size": 15,
            "method": "spearman",
            "strong_corr_threshold": 0.8,
            "weak_corr_threshold": 0.3,
            "delta_threshold": 0.5,
        }
    )

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 200
    assert response.get_json()["configuration"] == {
        "window_size": 30,
        "step_size": 15,
        "method": "spearman",
        "strong_corr_threshold": 0.8,
        "weak_corr_threshold": 0.3,
        "delta_threshold": 0.5,
    }


def test_api_validates_configuration_before_preprocessing(client):
    payload = _payload()
    payload["window_size"] = 0
    for row in payload["data"]:
        row["time"] = "invalid timestamp"

    response = client.post("/detect-correlation-alert", json=payload)

    assert response.status_code == 400
    assert "window_size" in response.get_json()["message"]
