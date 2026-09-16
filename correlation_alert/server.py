import time
import uuid

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from .correlation import (
    DEFAULT_DELTA_THRESHOLD,
    DEFAULT_HIGH_THRESHOLD,
    DEFAULT_MEDIUM_THRESHOLD,
    DEFAULT_METHOD,
    DEFAULT_STEP_SIZE,
    DEFAULT_STRONG_THRESHOLD,
    DEFAULT_WEAK_THRESHOLD,
    DEFAULT_WINDOW_SIZE,
    validate_correlation_parameters,
)
from .main import detect_correlation_change_alert
from .logging_config import get_logger
from .preprocessing import InputValidationError
from .serialization import serialize_correlation_results, with_iso_timestamps
from .settings import load_settings


ALLOWED_API_METHODS = {"pearson", "spearman"}


def _parse_integer(value, name):
    if isinstance(value, bool):
        raise InputValidationError(f"{name} must be an integer")
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise InputValidationError(f"{name} must be an integer") from exc
    if not numeric.is_integer():
        raise InputValidationError(f"{name} must be an integer")
    return int(numeric)


def _parse_float(value, name):
    if isinstance(value, bool):
        raise InputValidationError(f"{name} must be numeric")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise InputValidationError(f"{name} must be numeric") from exc


def _parse_frequency(value):
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return str(value)
    return int(numeric) if numeric.is_integer() else numeric


def _parse_selected_streams(value):
    if isinstance(value, str):
        value = [item.strip() for item in value.split(",") if item.strip()]
    if not isinstance(value, (list, tuple)):
        raise InputValidationError("selected_streams must be a list or comma separated string")
    return list(value)


def _parse_method(value):
    method = str(value).lower()
    if method not in ALLOWED_API_METHODS:
        raise InputValidationError("method must be either pearson or spearman")
    return method


def parse_request_input():
    """Read JSON or multipart data and return typed pipeline arguments."""
    if "file" in request.files:
        source = request.form
        df = pd.read_csv(request.files["file"])
    else:
        source = request.get_json(silent=True)
        if not isinstance(source, dict):
            raise InputValidationError("Request body must be a JSON object")
        data = source.get("data")
        if data is None:
            raise InputValidationError("Missing 'data' in request body")
        df = pd.DataFrame(data)

    df.columns = df.columns.str.strip()
    timestamp_col = source.get("timestamp_col")
    selected_streams = source.get("selected_streams")
    if not timestamp_col:
        raise InputValidationError("Missing 'timestamp_col'")
    if selected_streams is None:
        raise InputValidationError("Missing 'selected_streams'")

    return {
        "df": df,
        "timestamp_col": timestamp_col,
        "selected_streams": _parse_selected_streams(selected_streams),
        "window_size": _parse_integer(source.get("window_size", DEFAULT_WINDOW_SIZE), "window_size"),
        "step_size": _parse_integer(source.get("step_size", DEFAULT_STEP_SIZE), "step_size"),
        "method": _parse_method(source.get("method", DEFAULT_METHOD)),
        "strong_corr_threshold": _parse_float(
            source.get("strong_corr_threshold", DEFAULT_STRONG_THRESHOLD),
            "strong_corr_threshold",
        ),
        "weak_corr_threshold": _parse_float(
            source.get("weak_corr_threshold", DEFAULT_WEAK_THRESHOLD),
            "weak_corr_threshold",
        ),
        "delta_threshold": _parse_float(
            source.get("delta_threshold", DEFAULT_DELTA_THRESHOLD),
            "delta_threshold",
        ),
        "medium_threshold": _parse_float(
            source.get("medium_threshold", DEFAULT_MEDIUM_THRESHOLD),
            "medium_threshold",
        ),
        "high_threshold": _parse_float(
            source.get("high_threshold", DEFAULT_HIGH_THRESHOLD),
            "high_threshold",
        ),
        "sampling_frequency": _parse_frequency(source.get("sampling_frequency")),
        "missing_method": source.get("missing_method", "interpolate"),
        "iqr_factor": _parse_float(source.get("iqr_factor", 3.0), "iqr_factor"),
    }


def build_api_response(result, pipeline_arguments, request_id, runtime_ms):
    """Build the stable JSON response from pipeline output."""
    data_quality = result.get("data_quality", {})
    return {
        "status": "success",
        "request_id": request_id,
        "runtime_ms": runtime_ms,
        "configuration": {
            name: pipeline_arguments[name]
            for name in (
                "window_size",
                "step_size",
                "method",
                "strong_corr_threshold",
                "weak_corr_threshold",
                "delta_threshold",
            )
        },
        "summary": {
            "processed_rows": len(result["processed_data"]),
            "windows": len(result["windows"]),
            "correlation_results": len(result["correlation_results"]),
            "changes": len(result["changes"]),
            "alerts": len(result["alerts"]),
            "skipped_pairs": len(result["skipped_pairs"]),
            "non_numeric_values_coerced": data_quality.get("non_numeric_coerced", 0),
            "missing_values_imputed": data_quality.get("missing_imputed", 0),
        },
        "data_quality": data_quality,
        "correlations": serialize_correlation_results(result["correlation_results"]),
        "alerts": with_iso_timestamps(result["alerts"]),
        "changes": with_iso_timestamps(result["changes"]),
        "skipped_pairs": with_iso_timestamps(result["skipped_pairs"]),
    }


def _run_pipeline_self_test():
    """Run a small frame through the real analysis pipeline."""
    frame = pd.DataFrame(
        {
            "time": range(30),
            "sensor_a": [index % 7 for index in range(30)],
            "sensor_b": [(index * 3) % 11 for index in range(30)],
        }
    )
    detect_correlation_change_alert(
        frame,
        "time",
        ["sensor_a", "sensor_b"],
        window_size=10,
        step_size=5,
        method="pearson",
    )


def _readiness_checks():
    """Return readiness and diagnostic results for required components."""
    checks = {}
    ready = True

    try:
        import numpy

        checks["dependencies"] = {
            "ok": True,
            "pandas": pd.__version__,
            "numpy": numpy.__version__,
        }
    except Exception as exc:
        ready = False
        checks["dependencies"] = {"ok": False, "error": str(exc)}

    try:
        _run_pipeline_self_test()
        checks["pipeline"] = {
            "ok": True,
            "detail": "self test completed",
        }
    except Exception as exc:
        ready = False
        checks["pipeline"] = {"ok": False, "error": str(exc)}

    return ready, checks


def log_startup(logger, service_settings):
    """Log the active non-secret settings before Flask starts."""
    logger.info(
        "event=startup service_url=%s timeout_seconds=%d log_level=%s "
        "log_file=%s debug=%s",
        service_settings.service_url,
        service_settings.request_timeout_seconds,
        service_settings.log_level,
        service_settings.log_file,
        service_settings.debug,
    )


def create_app(service_settings=None):
    """Create the Flask application for the correlation alert service."""
    configured = service_settings or load_settings()
    logger = get_logger("api", configured)
    app = Flask(__name__)
    app.config["SERVICE_SETTINGS"] = configured
    CORS(app)

    @app.get("/service-status")
    def service_status():
        started_at = time.perf_counter()
        ready, checks = _readiness_checks()
        check_duration_ms = int((time.perf_counter() - started_at) * 1000)
        body = {
            "status": "running" if ready else "degraded",
            "message": (
                "Correlation Alert Service is running."
                if ready
                else "Correlation Alert Service is running but is not ready."
            ),
            "service": "correlation-alert-api",
            "live": True,
            "ready": ready,
            "checks": checks,
            "check_duration_ms": check_duration_ms,
            "config": configured.as_dict(),
        }
        if ready:
            logger.info("health ready=true check_ms=%d", check_duration_ms)
        else:
            logger.error("health ready=false check_ms=%d", check_duration_ms)
        return jsonify(body), (200 if ready else 503)

    @app.post("/detect-correlation-alert")
    def detect_correlation_alert_api():
        request_id = uuid.uuid4().hex[:8]
        started_at = time.perf_counter()
        request_source = "file" if "file" in request.files else "json"

        def elapsed_ms():
            return int((time.perf_counter() - started_at) * 1000)

        try:
            pipeline_arguments = parse_request_input()
            logger.info(
                "request_id=%s event=received source=%s rows_in=%d "
                "streams=%s window_size=%d step_size=%d method=%s",
                request_id,
                request_source,
                len(pipeline_arguments["df"]),
                ",".join(pipeline_arguments["selected_streams"]),
                pipeline_arguments["window_size"],
                pipeline_arguments["step_size"],
                pipeline_arguments["method"],
            )
            validate_correlation_parameters(
                window_size=pipeline_arguments["window_size"],
                step_size=pipeline_arguments["step_size"],
                method=pipeline_arguments["method"],
                strong_corr_threshold=pipeline_arguments["strong_corr_threshold"],
                weak_corr_threshold=pipeline_arguments["weak_corr_threshold"],
                delta_threshold=pipeline_arguments["delta_threshold"],
                medium_threshold=pipeline_arguments["medium_threshold"],
                high_threshold=pipeline_arguments["high_threshold"],
            )
            result = detect_correlation_change_alert(**pipeline_arguments)
            runtime_ms = elapsed_ms()
            logger.info(
                "request_id=%s event=completed rows_out=%d windows=%d "
                "alerts=%d runtime_ms=%d",
                request_id,
                len(result["processed_data"]),
                len(result["windows"]),
                len(result["alerts"]),
                runtime_ms,
            )
            if runtime_ms > configured.request_timeout_seconds * 1000:
                logger.warning(
                    "request_id=%s event=slow runtime_ms=%d timeout_seconds=%d",
                    request_id,
                    runtime_ms,
                    configured.request_timeout_seconds,
                )
            response = build_api_response(
                result,
                pipeline_arguments,
                request_id,
                runtime_ms,
            )
            return jsonify(response), 200
        except InputValidationError as exc:
            logger.warning(
                "request_id=%s event=failed error_type=invalid_input "
                "runtime_ms=%d message=%s",
                request_id,
                elapsed_ms(),
                exc,
            )
            return (
                jsonify(
                    {
                        "status": "error",
                        "error_type": "invalid_input",
                        "request_id": request_id,
                        "message": str(exc),
                    }
                ),
                400,
            )
        except Exception as exc:
            logger.error(
                "request_id=%s event=failed error_type=internal_error "
                "runtime_ms=%d exception=%s",
                request_id,
                elapsed_ms(),
                type(exc).__name__,
            )
            return (
                jsonify(
                    {
                        "status": "error",
                        "error_type": "internal_error",
                        "request_id": request_id,
                        "message": str(exc),
                    }
                ),
                500,
            )

    return app


app = create_app()


if __name__ == "__main__":
    runtime_settings = app.config["SERVICE_SETTINGS"]
    log_startup(get_logger("api", runtime_settings), runtime_settings)
    app.run(
        host=runtime_settings.host,
        port=runtime_settings.port,
        debug=runtime_settings.debug,
    )
