from __future__ import annotations

from datetime import datetime, timezone
from math import isinf, isnan
from typing import Any


def _to_python_list(value: Any) -> list[Any]:
    """
    Convert pandas Series/Index, numpy arrays or scalar values
    into standard Python lists.
    """

    if hasattr(value, "tolist"):
        value = value.tolist()

    if isinstance(value, list):
        return value

    if isinstance(value, (str, bytes)):
        return [value]

    try:
        return list(value)
    except TypeError:
        return [value]


def _convert_timestamp(timestamp: Any) -> str:
    """
    Convert timestamps into ISO 8601 UTC strings.
    """

    if hasattr(timestamp, "isoformat"):

        if isinstance(timestamp, datetime):

            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(
                    tzinfo=timezone.utc
                )
            else:
                timestamp = timestamp.astimezone(
                    timezone.utc
                )

        return timestamp.isoformat().replace(
            "+00:00",
            "Z",
        )

    if isinstance(timestamp, str):

        try:
            parsed = datetime.fromisoformat(
                timestamp.replace(
                    "Z",
                    "+00:00",
                )
            )

            return parsed.astimezone(
                timezone.utc
            ).isoformat().replace(
                "+00:00",
                "Z",
            )

        except ValueError:
            raise ValueError(
                f"Invalid timestamp value: {timestamp!r}"
            )

    raise ValueError(
        f"Invalid timestamp value: {timestamp!r}"
    )


def adapt_models_output(
    model_result: dict[str, Any],
    input_context: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Convert raw Models detector output into Draft V0.1 alert objects.

    Returns only Draft V0.1 alert objects.

    The shared response envelope is created separately by the
    Analytics Integration shared envelope builder.

    The runtime value represents the execution time of the
    complete Models detector batch. When multiple alerts are
    generated, the same batch runtime is included in each
    alert's supporting values.
    """

    if not isinstance(model_result, dict):
        raise TypeError(
            "model_result must be a dictionary."
        )

    if not isinstance(input_context, dict):
        raise TypeError(
            "input_context must be a dictionary."
        )

    required_fields = [
        "model_name",
        "timestamp",
        "anomaly_flag",
        "score",
        "runtime",
    ]

    missing = [
        field
        for field in required_fields
        if field not in model_result
    ]

    if missing:
        raise ValueError(
            f"Missing Models output fields: "
            f"{', '.join(missing)}"
        )

    metrics = input_context.get("metrics")

    if metrics is None:
        raise ValueError(
            "input_context must contain metrics."
        )

    if not isinstance(metrics, list) or len(metrics) == 0:
        raise ValueError(
            "input_context['metrics'] must contain "
            "at least one metric."
        )

    model_name = str(
        model_result["model_name"]
    ).strip()

    if not model_name:
        raise ValueError(
            "model_name cannot be empty."
        )

    runtime = model_result["runtime"]

    if runtime is None:
        raise ValueError(
            "runtime cannot be None."
        )
 # runtime represents the execution time of the complete
 # Models detector batch, not an individual alert.
 # The batch runtime is included in each generated alert.
    try:
        runtime_ms = round(
            float(runtime) * 1000,
            3,
        )
    except (TypeError, ValueError):
        raise ValueError(
            "runtime must be a valid numeric value."
        )

    timestamps = _to_python_list(
        model_result["timestamp"]
    )

    flags = _to_python_list(
        model_result["anomaly_flag"]
    )

    scores = _to_python_list(
        model_result["score"]
    )

    if not (
        len(timestamps)
        == len(flags)
        == len(scores)
    ):
        raise ValueError(
            f"Length mismatch: "
            f"timestamps={len(timestamps)}, "
            f"flags={len(flags)}, "
            f"scores={len(scores)}."
        )

    sensor_values = input_context.get(
        "sensor_values"
    )

    if sensor_values is not None:

        sensor_values = _to_python_list(
            sensor_values
        )

        if len(sensor_values) != len(scores):
            raise ValueError(
                "sensor_values length does not "
                "match detector output."
            )

    alerts = []

    for index, (
        timestamp,
        flag,
        score,
    ) in enumerate(
        zip(
            timestamps,
            flags,
            scores,
        )
    ):

        try:
            is_anomaly = bool(flag)
        except Exception:
            raise ValueError(
                "Invalid anomaly_flag value."
            )

        if not is_anomaly:
            continue

        try:
            score = float(score)
        except (TypeError, ValueError):
            raise ValueError(
                "Invalid anomaly score."
            )

        if isnan(score) or isinf(score):
            raise ValueError(
                "Invalid anomaly score."
            )

        alert = {
            "timestamp": _convert_timestamp(
                timestamp
            ),
            "alert_type": "POINTWISE_ANOMALY",
            "target": {
                "entity_id": input_context.get(
                    "entity_id"
                ),
                "metrics": metrics,
            },
            "method": model_name,
            "score": score,
            "score_metadata": {
                "type": "raw_anomaly_score",
                "normalized": False,
            },
            "severity": None,
            "message": (
                f"Anomaly detected in "
                f"{metrics[0]} "
                f"using "
                f"{model_name}."
            ),
            "time_window": None,
            "supporting_values": {
                "runtime_ms": runtime_ms,
            },
            "source": {
                "component": "models",
            },
            "alert_id": None,
        }

        if sensor_values is not None:
            alert["supporting_values"][
                "sensor_value"
            ] = sensor_values[index]

        if "threshold" in model_result:
            alert["supporting_values"][
                "threshold"
            ] = model_result["threshold"]

        alerts.append(alert)

    return alerts