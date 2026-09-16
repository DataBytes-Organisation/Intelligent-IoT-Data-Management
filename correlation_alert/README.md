# Correlation Alert Service:

## Overview:

The Correlation Alert Service detects changes between IoT data streams. It cleans input data, creates rolling windows, calculates correlations, compares consecutive windows, and returns alerts.

The Flask API accepts JSON data or an uploaded CSV file. The service includes runtime settings, structured logs, readiness checks, regression tests, and a dedicated CI workflow.

## Project structure:

1. `preprocessing.py` validates and cleans input data.
2. `correlation.py` calculates correlations and generates alerts.
3. `serialization.py` converts results into API safe values.
4. `main.py` connects preprocessing with correlation analysis.
5. `settings.py` loads runtime values from environment variables.
6. `logging_config.py` configures console and file logging.
7. `server.py` provides the Flask API.
8. `tests/` contains automated regression tests.
9. `docs/evidence/` contains task evidence and manual benchmark scripts.

## Requirements:

Use Python 3.13. Run every command from the repository root.

## Installation:

Create and activate a virtual environment on macOS or Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install the pinned dependencies:

```bash
python -m pip install -r correlation_alert/requirements.txt
```

## Run the server:

```bash
python -m correlation_alert.server
```

The default address is `http://127.0.0.1:5001`.

Keep this terminal open while testing the API.

## Check service readiness:

Open a second terminal:

```bash
curl http://127.0.0.1:5001/service-status
```

A ready service returns HTTP `200` with these fields:

```json
{
  "status": "running",
  "service": "correlation-alert-api",
  "live": true,
  "ready": true,
  "checks": {
    "dependencies": {"ok": true},
    "pipeline": {"ok": true}
  }
}
```

A live service with a failed readiness check returns HTTP `503`.

## Configure the service:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORRELATION_HOST` | `127.0.0.1` | Network interface used by Flask. |
| `CORRELATION_PORT` | `5001` | Flask port. |
| `CORRELATION_SERVICE_URL` | Built from host and port | Public service address. |
| `CORRELATION_TIMEOUT_SECONDS` | `30` | Runtime budget before a request is logged as slow. |
| `CORRELATION_LOG_LEVEL` | `INFO` | Minimum log level. |
| `CORRELATION_LOG_FILE` | Empty | Optional log file path. |
| `CORRELATION_DEBUG` | `false` | Flask debug mode. |

Example for macOS or Linux:

```bash
export CORRELATION_PORT=5002
export CORRELATION_LOG_LEVEL=WARNING
python -m correlation_alert.server
```

## Test the API with a CSV file:

```bash
curl -X POST http://127.0.0.1:5001/detect-correlation-alert \
  -F "file=@datasets/nab_realtraffic/traffic_4stream_merged.csv" \
  -F "timestamp_col=timestamp" \
  -F "selected_streams=occupancy_t4013,speed_t4013,occupancy_6005,speed_6005" \
  -F "window_size=60" \
  -F "step_size=30" \
  -F "method=pearson" \
  -F "sampling_frequency=5min"
```

The response includes `request_id`, `runtime_ms`, `configuration`, `summary`, `data_quality`, `correlations`, `changes`, `alerts`, and `skipped_pairs`.

Invalid caller input returns HTTP `400` with `error_type` set to `invalid_input`.

## Run automated tests:

```bash
python -m pytest correlation_alert/tests -q
```

## Continuous integration:

The workflow is stored in `.github/workflows/correlation-alert-tests.yml`.

It installs `correlation_alert/requirements.txt` and runs the complete correlation test suite. It runs for relevant pushes, pull requests, and manual workflow dispatches.

## Operational support:

See [Correlation_Operational_Runbook.md](docs/uploaded_docs/Correlation_Operational_Runbook.md) for health checks, log interpretation, and recovery steps.
