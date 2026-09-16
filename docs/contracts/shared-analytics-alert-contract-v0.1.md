# Shared Analytics Alert Contract

**Status:** Draft V0.1  
**Owner:** Analytics Integration  
**Last updated:** 5 August 2026

## 1. Purpose

This document defines the shared JSON format used when Models and Correlation results are passed through Analytics Integration to Backend and Frontend.

Models and Correlation may keep different internal outputs. Analytics Integration is responsible for adapting both into one predictable response structure.

This is a working draft. Fields may change after review by Models, Correlation, Backend, Frontend and Architecture.

## 2. Shared response structure

Every Analytics response should use the following outer envelope:

```json
{
  "status": "success",
  "generated_at": "2026-08-05T08:30:00Z",
  "alerts": [],
  "summary": {
    "processed_items": 0,
    "alert_count": 0
  },
  "errors": []
}
```

Rules:

- `alerts` is always a list.
- No alerts means `"alerts": []`.
- Multiple Models or Correlation alerts may be returned in the same response.
- `errors` is always a list.
- All timestamps must use ISO 8601 UTC.

## 3. Shared alert fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `timestamp` | string | Yes | Event or detection time in ISO 8601 UTC |
| `alert_type` | string | Yes | Type of Analytics alert |
| `target` | object | Yes | Affected entity and sensor metric names |
| `method` | string | Yes | Detector or correlation method |
| `message` | string | Yes | Human-readable explanation |
| `source` | object | Yes | Source component, such as Models or Correlation |
| `score` | number or null | No | Raw or normalized score |
| `score_metadata` | object or null | No | Meaning and normalization status of the score |
| `severity` | string or null | No | `LOW`, `MEDIUM` or `HIGH` |
| `time_window` | object or null | No | Analysis start, end, window size and step size |
| `supporting_values` | object | No | Source-specific values and diagnostic details |
| `alert_id` | string or null | No | Persistent identifier, expected to be assigned by Backend |

## 4. Supported alert types

- `POINTWISE_ANOMALY`
- `CORRELATION_CHANGE`

## 5. Models alert example

```json
{
  "timestamp": "2026-08-05T08:25:00Z",
  "alert_type": "POINTWISE_ANOMALY",
  "target": {
    "entity_id": null,
    "metrics": ["temperature"]
  },
  "method": "IsolationForest",
  "score": 0.1825,
  "score_metadata": {
    "type": "raw_anomaly_score",
    "normalized": false
  },
  "severity": null,
  "message": "Anomaly detected in temperature.",
  "time_window": null,
  "supporting_values": {
    "sensor_value": 88.5,
    "runtime_ms": 35
  },
  "source": {
    "component": "models"
  },
  "alert_id": null
}
```

Notes:

- Models scores are not assumed to be comparable across detectors.
- `sensor_value` is included only when the adapter receives the original sensor data.
- `severity` remains optional until shared rules are agreed.

## 6. Correlation alert example

```json
{
  "timestamp": "2026-08-05T08:25:00Z",
  "alert_type": "CORRELATION_CHANGE",
  "target": {
    "entity_id": null,
    "metrics": ["temperature", "pressure"]
  },
  "method": "Rolling_Pearson_Correlation",
  "score": 0.79,
  "score_metadata": {
    "type": "absolute_correlation_delta",
    "normalized": false
  },
  "severity": "HIGH",
  "message": "Correlation between temperature and pressure changed by 0.79.",
  "time_window": {
    "start": "2026-08-05T08:20:00Z",
    "end": "2026-08-05T08:25:00Z",
    "window_size": 30,
    "step_size": 5
  },
  "supporting_values": {
    "previous_correlation": 0.91,
    "current_correlation": 0.12,
    "delta": 0.79,
    "window_index": 4
  },
  "source": {
    "component": "correlation"
  },
  "alert_id": null
}
```

Notes:

- Correlation request context may be required to provide `method`, `window_size` and `step_size`.
- The alert timestamp should represent the event or window end time, not the time the adapter ran.

## 7. No-alert and error examples

### No alerts

```json
{
  "status": "success",
  "generated_at": "2026-08-05T08:30:00Z",
  "alerts": [],
  "summary": {
    "processed_items": 100,
    "alert_count": 0
  },
  "errors": []
}
```

### Validation error

```json
{
  "status": "error",
  "generated_at": "2026-08-05T08:30:00Z",
  "alerts": [],
  "summary": {
    "processed_items": 0,
    "alert_count": 0
  },
  "errors": [
    {
      "code": "INVALID_ANALYTICS_RESPONSE",
      "field": "timestamp",
      "message": "timestamp must be a valid ISO 8601 UTC string"
    }
  ]
}
```

## 8. Ownership

- **Models:** Provides raw detector results and documents detector-specific score behaviour.
- **Correlation:** Provides raw relationship-change results and request configuration.
- **Analytics Integration:** Adapts source outputs, validates this contract and returns standard responses.
- **Backend:** Confirms persistence, API behaviour and permanent `alert_id` ownership.
- **Frontend:** Confirms which fields are required for display and interaction.
- **Architecture:** Reviews cross-service consistency, deployment and security requirements.

## 9. Open decisions

The following items must be confirmed before Version 1.0:

- Final score normalization rules
- Final severity rules
- Permanent alert ID ownership
- Required versus optional Backend fields
- Frontend display requirements
- Partial service failure behaviour
- Batch limits and pagination
- Final naming of fields and error codes

## 10. Change process

Any contract change should:

1. Be discussed with affected teams.
2. Be recorded in this document.
3. Be reflected in adapters, fixtures, validators and tests.
4. Avoid silently changing field names or types.
5. Use a new version when a change breaks existing consumers.
