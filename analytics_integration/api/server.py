"""
[AIntg-003] Backend-facing Analytics Integration API.

Endpoints:

GET  /health
POST /analytics/analyze
"""

from __future__ import annotations

import pandas as pd

from flask import (
    Flask,
    current_app,
    jsonify,
    request,
)

from data_science.input_validator import (
    InputValidationError,
)

from analytics_integration.pipeline import (
    run_analytics_pipeline,
)

from analytics_integration.builders.envelope_builder import (
    build_analytics_response,
)


SUPPORTED_DETECTORS = {
    "isolationforest",
}

SUPPORTED_CORRELATION_METHODS = {
    "pearson",
    "spearman",
}


def _build_error_response(
    code: str,
    message: str,
    http_status: int,
):
    response = build_analytics_response(
        models_alerts=[],
        correlation_alerts=[],
        processed_items=0,
        errors=[
            {
                "code": code,
                "message": message,
            }
        ],
    )

    return jsonify(response), http_status


def _validate_request_payload(
    payload,
) -> list[str]:
    errors = []

    if not isinstance(payload, dict):
        return [
            "Request body must be a JSON object."
        ]

    data = payload.get("data")

    if not isinstance(data, list):
        errors.append(
            "data must be a list."
        )
    elif len(data) == 0:
        errors.append(
            "data must not be empty."
        )
    elif not all(
        isinstance(row, dict)
        for row in data
    ):
        errors.append(
            "Every item in data must be an object."
        )

    timestamp_col = payload.get(
        "timestamp_col"
    )

    if (
        not isinstance(timestamp_col, str)
        or not timestamp_col.strip()
    ):
        errors.append(
            "timestamp_col must be a non-empty string."
        )

    entity_id = payload.get(
        "entity_id"
    )

    if (
        entity_id is not None
        and not isinstance(entity_id, str)
    ):
        errors.append(
            "entity_id must be a string or null."
        )

    model = payload.get("model")

    if not isinstance(model, dict):
        errors.append(
            "model must be an object."
        )
        model = {}

    model_metric = model.get("metric")

    if (
        not isinstance(model_metric, str)
        or not model_metric.strip()
    ):
        errors.append(
            "model.metric must be a non-empty string."
        )

    detector = model.get(
        "detector",
        "isolationforest",
    )

    if detector not in SUPPORTED_DETECTORS:
        errors.append(
            "model.detector must currently be "
            "isolationforest."
        )

    parameters = model.get(
        "parameters",
        {},
    )

    if not isinstance(parameters, dict):
        errors.append(
            "model.parameters must be an object."
        )

    correlation = payload.get(
        "correlation"
    )

    if not isinstance(correlation, dict):
        errors.append(
            "correlation must be an object."
        )
        correlation = {}

    streams = correlation.get("streams")

    if not isinstance(streams, list):
        errors.append(
            "correlation.streams must be a list."
        )
        streams = []
    else:
        if len(streams) < 2:
            errors.append(
                "correlation.streams must contain "
                "at least two streams."
            )

        if not all(
            isinstance(stream, str)
            and stream.strip()
            for stream in streams
        ):
            errors.append(
                "correlation.streams must contain "
                "only non-empty strings."
            )

        if len(streams) != len(set(streams)):
            errors.append(
                "correlation.streams must not "
                "contain duplicates."
            )

    window_size = correlation.get(
        "window_size",
        20,
    )

    if (
        not isinstance(window_size, int)
        or isinstance(window_size, bool)
        or window_size <= 0
    ):
        errors.append(
            "correlation.window_size must be "
            "a positive integer."
        )

    step_size = correlation.get(
        "step_size",
        10,
    )

    if (
        not isinstance(step_size, int)
        or isinstance(step_size, bool)
        or step_size <= 0
    ):
        errors.append(
            "correlation.step_size must be "
            "a positive integer."
        )

    method = correlation.get(
        "method",
        "pearson",
    )

    if (
        method
        not in SUPPORTED_CORRELATION_METHODS
    ):
        errors.append(
            "correlation.method must be "
            "pearson or spearman."
        )

    if (
        isinstance(data, list)
        and data
        and all(
            isinstance(row, dict)
            for row in data
        )
    ):
        columns = set()

        for row in data:
            columns.update(row.keys())

        if (
            isinstance(timestamp_col, str)
            and timestamp_col
            and timestamp_col not in columns
        ):
            errors.append(
                f"timestamp_col '{timestamp_col}' "
                "was not found in data."
            )

        if (
            isinstance(model_metric, str)
            and model_metric
            and model_metric not in columns
        ):
            errors.append(
                f"model.metric '{model_metric}' "
                "was not found in data."
            )

        for stream in streams:
            if stream not in columns:
                errors.append(
                    f"correlation stream '{stream}' "
                    "was not found in data."
                )

    return errors


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "service": (
                    "analytics-integration"
                ),
            }
        ), 200

    @app.post("/analytics/analyze")
    def analyze():
        payload = request.get_json(
            silent=True
        )

        request_errors = (
            _validate_request_payload(
                payload
            )
        )

        if request_errors:
            return _build_error_response(
                code="INVALID_REQUEST",
                message="; ".join(
                    request_errors
                ),
                http_status=400,
            )

        data = payload["data"]
        model = payload["model"]
        correlation = payload[
            "correlation"
        ]

        df = pd.DataFrame(data)

        try:
            response = run_analytics_pipeline(
                df=df,
                timestamp_col=payload[
                    "timestamp_col"
                ],
                entity_id=payload.get(
                    "entity_id"
                ),
                model_metric=model[
                    "metric"
                ],
                correlation_streams=(
                    correlation["streams"]
                ),
                detector_name=model.get(
                    "detector",
                    "isolationforest",
                ),
                detector_parameters=(
                    model.get(
                        "parameters",
                        {},
                    )
                ),
                correlation_window_size=(
                    correlation.get(
                        "window_size",
                        20,
                    )
                ),
                correlation_step_size=(
                    correlation.get(
                        "step_size",
                        10,
                    )
                ),
                correlation_method=(
                    correlation.get(
                        "method",
                        "pearson",
                    )
                ),
            )

            return jsonify(response), 200

        except (
            InputValidationError,
            ValueError,
        ) as exc:
            return _build_error_response(
                code="INVALID_DATA",
                message=str(exc),
                http_status=400,
            )

        except Exception:
            current_app.logger.exception(
                "Analytics pipeline failed."
            )

            return _build_error_response(
                code="ANALYTICS_INTERNAL_ERROR",
                message=(
                    "Analytics pipeline failed."
                ),
                http_status=500,
            )

    return app


def main():
    app = create_app()

    app.run(
        host="0.0.0.0",
        port=5002,
        debug=False,
    )


if __name__ == "__main__":
    main()