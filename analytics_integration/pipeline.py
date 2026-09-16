"""
[AIntg-003] Reusable Analytics Intelligence pipeline

This module contains the reusable Analytics logic used by:

- the existing AIntg-002 smoke-test runner
- the AIntg-003 Backend-facing API

It does not load a dataset itself and does not assume specific
sensor names.
"""

from __future__ import annotations

import json

import pandas as pd

from data_science.input_validator import validate_input
from data_science.detector_runner import run_detector
from data_science.adapters.models_output_adapter import (adapt_models_output,)

from correlation_alert.server import create_app

from analytics_integration.adapters.correlation_adapter import (
    adapt_correlation_response,
)
from analytics_integration.builders.envelope_builder import (
    build_analytics_response,
)
from analytics_validation.response_validator import (
    validate_alert,
    validate_response,
)


def _require_columns(
    df: pd.DataFrame,
    required_columns: list[str],
) -> None:
    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Input data is missing required columns: {missing}"
        )


def run_models_path(
    df: pd.DataFrame,
    timestamp_col: str,
    model_metric: str,
    entity_id: str | None = None,
    detector_name: str = "isolationforest",
    detector_parameters: dict | None = None,
) -> tuple[list[dict], dict]:
    """
    Run the Models path:

    Data
    -> Models input validator
    -> detector runner
    -> Models Draft V0.1 adapter
    """

    _require_columns(
        df,
        [
            timestamp_col,
            model_metric,
        ],
    )

    model_df = df[
        [
            timestamp_col,
            model_metric,
        ]
    ].copy()

    validated_df = validate_input(
        model_df,
        timestamp_col=timestamp_col,
        sensor_cols=[model_metric],
        min_readings=20,
    )

    raw_model_result = run_detector(
        detector_name=detector_name,
        dataframe=validated_df[[model_metric]],
        parameters=detector_parameters,
    )

    if raw_model_result.get("status") != "success":
        raise RuntimeError(
            "Models runtime failed: "
            f"{raw_model_result.get('error', 'unknown error')}"
        )

    input_context = {
        "entity_id": entity_id,
        "metrics": [model_metric],
        "sensor_values": validated_df[
            model_metric
        ].tolist(),
    }

    models_alerts = adapt_models_output(
        raw_model_result,
        input_context,
    )

    for index, alert in enumerate(models_alerts):
        errors = validate_alert(alert)

        if errors:
            raise ValueError(
                f"Models alert {index} failed "
                f"Draft V0.1 validation: {errors}"
            )

    return models_alerts, raw_model_result


def run_correlation_path(
    df: pd.DataFrame,
    timestamp_col: str,
    correlation_streams: list[str],
    window_size: int = 20,
    step_size: int = 10,
    method: str = "pearson",
) -> tuple[list[dict], dict]:
    """
    Run the Correlation path:

    Data
    -> Correlation Flask API
    -> Correlation Draft V0.1 adapter
    """

    _require_columns(
        df,
        [
            timestamp_col,
            *correlation_streams,
        ],
    )

    correlation_df = df[
        [
            timestamp_col,
            *correlation_streams,
        ]
    ].copy()

    request_payload = {
        "data": correlation_df.to_dict(
            orient="records"
        ),
        "timestamp_col": timestamp_col,
        "selected_streams": correlation_streams,
        "window_size": window_size,
        "step_size": step_size,
        "method": method,
    }

    app = create_app()
    app.config.update(TESTING=True)

    with app.test_client() as client:
        response = client.post(
            "/detect-correlation-alert",
            json=request_payload,
        )

    raw_correlation_response = response.get_json()

    if response.status_code != 200:
        raise RuntimeError(
            "Correlation API failed. "
            f"HTTP {response.status_code}: "
            f"{raw_correlation_response}"
        )

    if (
        not isinstance(raw_correlation_response, dict)
        or raw_correlation_response.get("status")
        != "success"
    ):
        raise RuntimeError(
            "Correlation API returned an unexpected "
            f"response: {raw_correlation_response}"
        )

    request_context = raw_correlation_response.get(
        "configuration",
        {},
    )

    correlation_alerts = adapt_correlation_response(
        raw_correlation_response,
        request_context=request_context,
    )

    for index, alert in enumerate(
        correlation_alerts
    ):
        errors = validate_alert(alert)

        if errors:
            raise ValueError(
                f"Correlation alert {index} failed "
                f"Draft V0.1 validation: {errors}"
            )

    return (
        correlation_alerts,
        raw_correlation_response,
    )


def run_analytics_pipeline(
    df: pd.DataFrame,
    timestamp_col: str,
    entity_id: str | None,
    model_metric: str,
    correlation_streams: list[str],
    detector_name: str = "isolationforest",
    detector_parameters: dict | None = None,
    correlation_window_size: int = 20,
    correlation_step_size: int = 10,
    correlation_method: str = "pearson",
) -> dict:
    """
    Execute the complete reusable Analytics Intelligence path.
    """

    if not isinstance(df, pd.DataFrame):
        raise TypeError(
            "df must be a pandas DataFrame."
        )

    if df.empty:
        raise ValueError(
            "Input data contains no rows."
        )

    models_alerts, _ = run_models_path(
        df=df,
        timestamp_col=timestamp_col,
        model_metric=model_metric,
        entity_id=entity_id,
        detector_name=detector_name,
        detector_parameters=detector_parameters,
    )

    correlation_alerts, _ = run_correlation_path(
        df=df,
        timestamp_col=timestamp_col,
        correlation_streams=correlation_streams,
        window_size=correlation_window_size,
        step_size=correlation_step_size,
        method=correlation_method,
    )

    final_response = build_analytics_response(
        models_alerts=models_alerts,
        correlation_alerts=correlation_alerts,
        processed_items=len(df),
    )

    validation_errors = validate_response(
        final_response
    )

    if validation_errors:
        raise ValueError(
            "Final Analytics response failed "
            "Draft V0.1 validation: "
            f"{validation_errors}"
        )

    json.dumps(final_response)

    return final_response