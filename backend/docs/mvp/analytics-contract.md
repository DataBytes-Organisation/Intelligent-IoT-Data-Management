# Analytics Contract: Backend Data vs Correlation & Anomaly Service Inputs

## Purpose

This document records the current shape of data stored in our backend database, compares it against what the correlation and anomaly detection services expect, and identifies mismatches. It was produced by investigating the actual backend and correlation_alert source code directly, not just documentation, and by running real ingestion against ThingSpeak channel 12397 to confirm findings against live data.

## Current Stored Data Shape

Two different storage formats exist in the database, depending on ingestion source.

### 1. Wide format (ThingSpeak ingestion), table: `timeseries`

Columns: `dataset_id, created_at, entry_id, field1...field8`

Real example row (channel 12397, entry_id 5683301):

dataset_id | created_at              | entry_id | field1 | field2 | field3 | field4 | field5 | field6 | field7 | field8
1          | 2026-07-30 21:36:15+10  | 5683301  | 170    | 3.9    | 0      | 0.1    | 0      | 29.52  | 0      | 0

Field labels are generic, inherited directly from ThingSpeak's own naming convention. Real meaning is only available via ThingSpeak's channel metadata, not stored in our own schema:

- field1: Wind Direction (degrees)
- field2: Wind Speed (mph)
- field3: % Humidity
- field4: Temperature (F)
- field5: Rain (inches/minute)
- field6: Pressure (inHg)
- field7: Power Level (V)
- field8: Light Intensity

### 2. Long format (CSV ingestion), table: `timeseries_long`

Columns: `ts, entity, metric, value`

This format already stores a real metric name per row and is structurally closer to a typical analytics-ready shape, one reading, one named metric, one row.

## What the Correlation Service Expects

Confirmed via `correlation_alert/testing/run_real_dataset.py` and its recorded output `real_alerts.json`:

- Endpoint: `POST /detect-correlation-alert`
- Input: CSV file upload (multipart/form-data), not JSON or direct DB rows
- Required parameters: `timestamp_col`, `selected_streams` (list of column names), `window_size`, `step_size`, `method` (pearson/spearman)
- Confirmed: the service works with generic field names (`field1`...`field8`) passed directly as `selected_streams`, no renaming required for the correlation math itself
- However, output alerts are also labeled using whatever names were passed in (e.g. "stream_pair": ["field1", "field5"]), so if generic names go in, the human-readable meaning is lost on the way out

## What the Anomaly Service Expects

No documented API contract could be found for the anomaly detection service. Unlike correlation, no standalone endpoint with a defined request/response format was identified in the docs, handover materials, or repo structure reviewed. This absence is itself logged as a mismatch, see mvp-tracker.md.

## Summary

| Requirement | Current State |
|---|---|
| Correlation service can technically process wide-format data | Yes, accepts generic field names directly |
| Correlation output is human-readable | No, output uses the same generic labels as input |
| Anomaly service input contract | Undocumented / unknown |
| Backend has a working connector to either service | No, /api/analyse is a placeholder stub |
| A field-name translation layer exists | Partially, hardcoded for 3 of 8 fields, for one specific test channel only |

Full details of each mismatch are recorded in mvp-tracker.md. A sample transformed payload is recorded in evidence/api-samples.json.

## Caveat

Findings are based on the public ThingSpeak test channel (12397), used as a placeholder pending the official project channel. Structural findings, data shape, format, and API expectations, remain valid regardless of which channel is used. Field-specific values may need revisiting once the real project channel is confirmed.