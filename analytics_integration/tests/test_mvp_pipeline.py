"""
[AIntg-002] Analytics Intelligence E2E smoke tests.

These tests verify the REAL Analytics path rather than
using manually prepared adapter fixtures.
"""

import json

from analytics_integration.run_mvp_pipeline import (
    load_smoke_dataset,
    run_models_path,
    run_correlation_path,
    run_mvp_pipeline,
)

from analytics_validation.response_validator import (
    validate_alert,
    validate_response,
)


def test_models_runtime_to_adapter():
    """
    Real dataset
    -> Models validator
    -> IsolationForest runner
    -> Models Draft V0.1 adapter
    """

    df = load_smoke_dataset(
        row_limit=120
    )

    alerts, raw_result = run_models_path(df)

    assert raw_result["status"] == "success"

    assert isinstance(alerts, list)

    # IsolationForest with the configured contamination should
    # produce anomaly results on a dataset of this size.
    assert len(alerts) > 0

    for alert in alerts:
        assert (
            alert["alert_type"]
            == "POINTWISE_ANOMALY"
        )

        assert validate_alert(alert) == []


def test_correlation_runtime_to_adapter():
    """
    Real dataset
    -> Correlation API
    -> Correlation Draft V0.1 adapter
    """

    df = load_smoke_dataset(
        row_limit=120
    )

    alerts, raw_response = run_correlation_path(
        df
    )

    assert raw_response["status"] == "success"

    assert (
        raw_response["summary"]["processed_rows"]
        > 0
    )

    assert isinstance(alerts, list)

    # A valid run may legitimately produce zero alerts,
    # so we do not require len(alerts) > 0.
    for alert in alerts:
        assert (
            alert["alert_type"]
            == "CORRELATION_CHANGE"
        )

        assert validate_alert(alert) == []


def test_full_analytics_intelligence_e2e():
    """
    Full AIntl smoke test:

    Dataset
    -> Models runtime
    -> Models adapter

    Dataset
    -> Correlation API
    -> Correlation adapter

    Both
    -> Envelope Builder
    -> Validator
    -> Final Draft V0.1 JSON
    """

    response = run_mvp_pipeline(
        row_limit=300
    )

    assert response["status"] == "success"

    assert isinstance(
        response["alerts"],
        list,
    )

    assert (
        response["summary"]["processed_items"]
        == 300
    )

    assert (
        response["summary"]["alert_count"]
        == len(response["alerts"])
    )

    assert response["errors"] == []

    # Final shared contract validation.
    assert validate_response(response) == []

    # Final JSON serialisation.
    json.dumps(response)

    # Models should definitely have passed through the final envelope.
    assert any(
        alert["alert_type"]
        == "POINTWISE_ANOMALY"
        for alert in response["alerts"]
    )