import json
from math import inf, nan

import pandas as pd
import pytest

from data_science.adapters.models_output_adapter import (
    adapt_models_output,
)


def sample_context():
    return {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [29.8, 31.8, 30.1, 33.1],
    }


def test_single_anomaly_conversion():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
            "2026-08-05T08:21:00Z",
        ],
        "anomaly_flag": [
            False,
            True,
        ],
        "score": [
            0.12,
            0.91,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [29.8, 31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    assert len(result) == 1

    alert = result[0]

    assert alert["alert_type"] == "POINTWISE_ANOMALY"
    assert alert["method"] == "IsolationForest"
    assert alert["score"] == 0.91
    assert alert["target"]["entity_id"] == "sensor_node_01"
    assert alert["target"]["metrics"] == ["temperature"]
    assert alert["supporting_values"]["runtime_ms"] == 24.0
    assert (
        alert["message"]
        == "Anomaly detected in temperature using IsolationForest."
    )


def test_multiple_anomalies():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
            "2026-08-05T08:21:00Z",
            "2026-08-05T08:22:00Z",
            "2026-08-05T08:23:00Z",
        ],
        "anomaly_flag": [
            False,
            True,
            False,
            True,
        ],
        "score": [
            0.12,
            0.91,
            0.18,
            0.95,
        ],
        "runtime": 0.024,
    }

    result = adapt_models_output(
        model_result,
        sample_context(),
    )

    assert len(result) == 2
    assert result[0]["score"] == 0.91
    assert result[1]["score"] == 0.95


def test_no_anomalies_returns_empty_list():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
            "2026-08-05T08:21:00Z",
        ],
        "anomaly_flag": [
            False,
            False,
        ],
        "score": [
            0.12,
            0.18,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [29.8, 31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    assert result == []


def test_missing_required_field():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [],
    }

    with pytest.raises(ValueError):
        adapt_models_output(
            model_result,
            sample_context(),
        )


def test_invalid_input_type():

    with pytest.raises(TypeError):
        adapt_models_output(
            ["wrong input"],
            sample_context(),
        )


def test_missing_input_context():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [],
        "anomaly_flag": [],
        "score": [],
        "runtime": 0.024,
    }

    with pytest.raises(ValueError):
        adapt_models_output(
            model_result,
            {},
        )


def test_length_mismatch():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
            False,
        ],
        "score": [
            0.91,
        ],
        "runtime": 0.024,
    }

    with pytest.raises(ValueError):
        adapt_models_output(
            model_result,
            sample_context(),
        )


def test_invalid_timestamp():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "not-a-timestamp",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            0.91,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8],
    }

    with pytest.raises(ValueError):
        adapt_models_output(
            model_result,
            context,
        )


@pytest.mark.parametrize(
    "score",
    [
        nan,
        inf,
    ],
)
def test_invalid_scores(score):

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            score,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8],
    }

    with pytest.raises(ValueError):
        adapt_models_output(
            model_result,
            context,
        )


def test_runtime_conversion():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            0.91,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    assert (
        result[0]["supporting_values"]["runtime_ms"]
        == 24.0
    )


def test_invalid_runtime():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            0.91,
        ],
        "runtime": "invalid",
    }

    with pytest.raises(ValueError):
        adapt_models_output(
            model_result,
            sample_context(),
        )


def test_json_serializable():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            0.91,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    json.dumps(result)


def test_pandas_series_and_index():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": pd.Index(
            [
                "2026-08-05T08:20:00Z",
                "2026-08-05T08:21:00Z",
            ]
        ),
        "anomaly_flag": pd.Series(
            [
                False,
                True,
            ]
        ),
        "score": pd.Series(
            [
                0.12,
                0.91,
            ]
        ),
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [29.8, 31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    assert len(result) == 1
    assert result[0]["score"] == 0.91


def test_threshold_optional():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            0.91,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    assert (
        "threshold"
        not in result[0]["supporting_values"]
    )


def test_draft_v0_1_fields():

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
        ],
        "anomaly_flag": [
            True,
        ],
        "score": [
            0.91,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    alert = result[0]

    assert "timestamp" in alert
    assert alert["alert_type"] == "POINTWISE_ANOMALY"
    assert "target" in alert
    assert "method" in alert
    assert "message" in alert
    assert "source" in alert

    assert alert["source"]["component"] == "models"
    assert alert["target"]["entity_id"] == "sensor_node_01"
    assert alert["target"]["metrics"] == ["temperature"]


def test_batch_runtime_is_preserved_in_each_alert():
    """
    Verify that the detector runtime represents the complete
    Models batch runtime and is preserved in each generated alert.
    """

    model_result = {
        "model_name": "IsolationForest",
        "timestamp": [
            "2026-08-05T08:20:00Z",
            "2026-08-05T08:21:00Z",
        ],
        "anomaly_flag": [
            True,
            True,
        ],
        "score": [
            0.91,
            0.95,
        ],
        "runtime": 0.024,
    }

    context = {
        "entity_id": "sensor_node_01",
        "metrics": ["temperature"],
        "sensor_values": [31.8, 33.1],
    }

    result = adapt_models_output(
        model_result,
        context,
    )

    assert len(result) == 2

    # runtime is the complete detector batch runtime,
    # so the same value is included in each generated alert.
    assert (
        result[0]["supporting_values"]["runtime_ms"]
        == 24.0
    )

    assert (
        result[1]["supporting_values"]["runtime_ms"]
        == 24.0
    )