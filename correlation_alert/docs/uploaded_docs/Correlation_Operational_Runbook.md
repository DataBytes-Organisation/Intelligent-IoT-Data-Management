# Correlation Alert Operational Runbook:

Owner: Guna Varshith Kanagala

Task: CCA121

Use this runbook during local testing, an MVP demo, or deployment recovery.

## Service endpoints:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/service-status` | GET | Check liveness and readiness. |
| `/detect-correlation-alert` | POST | Run correlation analysis. |

## Prerequisites:

1. Use Python 3.13.
2. Run commands from the repository root.
3. Install `correlation_alert/requirements.txt`.

## Install and start:

On macOS or Linux:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r correlation_alert/requirements.txt
python -m correlation_alert.server
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r correlation_alert/requirements.txt
python -m correlation_alert.server
```

The default address is `http://127.0.0.1:5001`.

## Runtime settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORRELATION_HOST` | `127.0.0.1` | Network interface used by Flask. |
| `CORRELATION_PORT` | `5001` | Flask port. |
| `CORRELATION_SERVICE_URL` | Built from host and port | Address used by other services. |
| `CORRELATION_TIMEOUT_SECONDS` | `30` | Runtime budget before a slow warning. |
| `CORRELATION_LOG_LEVEL` | `INFO` | Minimum log level. |
| `CORRELATION_LOG_FILE` | Empty | Optional UTF-8 log file. |
| `CORRELATION_DEBUG` | `false` | Flask debug mode. |

Example on macOS or Linux:

```bash
export CORRELATION_PORT=5002
export CORRELATION_LOG_FILE=correlation.log
python -m correlation_alert.server
```

Example on Windows PowerShell:

```powershell
$env:CORRELATION_PORT="5002"
$env:CORRELATION_LOG_FILE="correlation.log"
python -m correlation_alert.server
```

## Health and readiness:

Run:

```bash
curl http://127.0.0.1:5001/service-status
```

HTTP `200` with `"ready": true` means the dependencies loaded and the pipeline self check passed.

HTTP `503` with `"ready": false` means the process is live but cannot safely serve analysis requests. Read the `checks` object to find the failed component.

The response also reports the active non-secret configuration and installed Pandas and NumPy versions.

## Log format:

Each line contains a timestamp, level, logger name, and structured fields.

Startup example:

```text
2026-08-18T06:30:00 INFO correlation.api event=startup service_url=http://127.0.0.1:5001 timeout_seconds=30 log_level=INFO log_file=None debug=False
```

Successful request example:

```text
2026-08-18T06:31:00 INFO correlation.api request_id=f22ed400 event=received source=file rows_in=1008 streams=s1,s2,s3 window_size=20 step_size=10 method=pearson
2026-08-18T06:31:00 INFO correlation.api request_id=f22ed400 event=completed rows_out=1008 windows=99 alerts=19 runtime_ms=45
```

Rejected request example:

```text
2026-08-18T06:32:00 WARNING correlation.api request_id=5c9063f9 event=failed error_type=invalid_input runtime_ms=2 message=Selected streams were not found
```

Internal failures log the exception class. They do not log the exception message because it could contain uploaded data.

The service never logs raw sensor readings or uploaded file contents.

## Common failures:

### Missing dependency:

Symptom:

```text
ModuleNotFoundError: No module named 'flask'
```

Recovery:

```bash
python -m pip install -r correlation_alert/requirements.txt
```

Restart the service.

### Port already in use:

Stop the old process or choose another port.

```bash
export CORRELATION_PORT=5002
python -m correlation_alert.server
```

### HTTP 400:

The request is invalid. Read `message` in the response, correct the fields, and resend it. A restart is not required.

Common causes include a missing timestamp column, fewer than two unique streams, unsupported methods, invalid window sizes, and invalid thresholds.

### HTTP 503:

Read `checks.dependencies` and `checks.pipeline` in the status response.

Reinstall the pinned dependencies if a dependency check fails. Run the automated tests if the pipeline check fails.

```bash
python -m pytest correlation_alert/tests -q
```

### HTTP 500:

Copy the `request_id` from the response. Find the matching `event=failed` log. Record the exception class and the commit SHA.

Do not share uploaded sensor data unless the dataset owner approves it.

### Slow request:

A request over `CORRELATION_TIMEOUT_SECONDS` completes normally but produces `event=slow`.

Runtime increases with row count, stream count, and number of rolling windows. Increase `step_size` or reduce the input size for a quick demo.

### Unexpected analysis result:

Check `summary` and `data_quality` in the response. These fields report processed rows, coercions, imputation, outlier replacement, skipped pairs, windows, and alerts.

Also record `checks.dependencies` from `/service-status`. Different library versions can produce different numeric results.

## Safe restart:

1. Stop Flask with `Ctrl+C`.
2. Clear incorrect environment overrides.
3. Start the service again from the repository root.
4. Confirm HTTP `200` from `/service-status`.
5. Send one known test request.

## Escalation evidence:

Capture these items:

1. Commit SHA.
2. Response `request_id`.
3. Matching request log lines.
4. The `checks` object from `/service-status`.
5. Dataset name and row count. Do not attach raw data without approval.
