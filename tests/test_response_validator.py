import json
from pathlib import Path

from analytics_validation.response_validator import validate_response


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_fixture(filename):
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as file:
        return json.load(file)


def test_valid_anomaly_response():
    response = load_fixture("valid_anomaly.json")
    is_valid, errors = validate_response(response)

    assert is_valid is True
    assert errors == []


def test_valid_correlation_response():
    response = load_fixture("valid_correlation.json")
    is_valid, errors = validate_response(response)

    assert is_valid is True
    assert errors == []


def test_invalid_anomaly_response():
    response = load_fixture("invalid_anomaly.json")
    is_valid, errors = validate_response(response)

    assert is_valid is False
    assert "Invalid ISO 8601 timestamp" in errors
    assert "Unsupported alert type: fault" in errors
    assert "target must be a string" in errors
    assert "score must be numeric" in errors
    assert "Unsupported severity: urgent" in errors
    assert "supporting_values must be an object" in errors


def test_invalid_correlation_response():
    response = load_fixture("invalid_correlation.json")
    is_valid, errors = validate_response(response)

    assert is_valid is False
    assert "Missing required field: target" in errors
    assert "Invalid ISO 8601 timestamp" in errors
    assert "score must be numeric" in errors
    assert "Unsupported severity: extreme" in errors
    assert "message must be a string" in errors
    assert "supporting_values must be an object" in errors