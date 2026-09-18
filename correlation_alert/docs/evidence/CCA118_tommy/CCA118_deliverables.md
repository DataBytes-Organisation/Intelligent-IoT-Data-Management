# CCA118 Deliverables:

## Objective:

Make the Correlation Alert Service runnable from the repository root and replace demonstration scripts with automated regression tests.

## Delivered:

1. Added pinned dependencies in `correlation_alert/requirements.txt`.
2. Corrected package imports for repository root execution.
3. Replaced print based checks with pytest tests and assertions.
4. Standardised pipeline output on `changes` instead of `change_results`.
5. Added `.github/workflows/correlation-alert-tests.yml` for CI.
6. Added install, run, API test, and pytest instructions in `correlation_alert/README.md`.

## Verification:

```text
Service status: HTTP 200, running
Automated tests: 33 passed
CI workflow syntax: valid
```
