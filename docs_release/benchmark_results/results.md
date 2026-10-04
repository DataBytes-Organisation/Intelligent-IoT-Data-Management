# PR 177 Benchmarking and Grafana Results

## Comparison Scope

- Baseline implementation: organisation `main` before PR 177, commit `8c140c602c8423191a61c80615f29bcd6c403db1`.
- Final implementation: merged PR 177 result, commit `46889b46058e7f752169f0c2e88fa428d3b51187`.
- PR: <https://github.com/DataBytes-Organisation/Intelligent-IoT-Data-Management/pull/177>.

PR 177 is a functional integration PR. It improves breadth, correctness, validation, dataset lifecycle behaviour, analytics support, dashboard usability, and evidence coverage. It is not primarily a low-level optimization PR, so the expected performance result is "more capable with monitored overhead" rather than uniformly lower latency for every endpoint.

## What Changed

- Backend: dataset ownership, soft deletion, recently deleted listing, restoration, expiry cleanup, migration scripts, upload limits, ThingSpeak ownership, and additional tests.
- Frontend: real dataset delete/restore flows, recently deleted UI, About page, CSV size validation, improved authentication UX, dashboard mini charts, expandable insight cards, precise time-range selection, and chart rendering improvements.
- Analytics integration: shared response envelope, stronger validation, single and multivariate model metric handling, correlation integration, and structured error handling.
- Models/data science: standalone model adapter, benchmark evidence, LSTM detector work, and expanded validation/testing assets.
- Correlation: structured request validation, stable error codes, upload safeguards, insufficient-data handling, and regression evidence.
- Observability alignment in this workspace: Docker Compose now pins Grafana/Prometheus/MailHog images, assigns explicit local image names to built services, and Prometheus scrapes Docker service DNS names.

## Benchmark Method

Run each implementation from a clean checkout or worktree, then run the same benchmark command against each base URL.

```bash
node scripts/benchmark-pr177-api.mjs --label=baseline-pr177 --baseUrl=http://127.0.0.1:3000 --iterations=50
node scripts/benchmark-pr177-api.mjs --label=final-pr177 --baseUrl=http://127.0.0.1:3000 --iterations=50
```

The benchmark writes:

- `benchmark_results/pr177-api/baseline-pr177.json`
- `benchmark_results/pr177-api/baseline-pr177.csv`
- `benchmark_results/pr177-api/final-pr177.json`
- `benchmark_results/pr177-api/final-pr177.csv`

## Measured Parameters

- Availability: `/health`, `/ready`, service `up` status in Prometheus.
- Backend request latency: average, p50, p95, max from the benchmark script and Grafana `iot_http_request_duration_seconds`.
- Request volume: total requests and route-level request rate from `iot_http_requests_total`.
- Error rate: benchmark failures and Grafana `4xx`/`5xx` percentage.
- Analytics latency: `iot_analytics_integration_request_duration_seconds` when analytics metrics are enabled.
- Analytics success/failure: `iot_analytics_integration_requests_total` by route/status.
- Database performance: `iot_db_query_duration_seconds` and `iot_db_queries_total`.
- ThingSpeak ingestion: poll success, retry count, rows inserted, and latest rows inserted.
- Container runtime: service up/down, restart count, CPU percent, and memory usage from `docker-service-exporter`.

## Grafana Evidence Panels

Use `http://localhost:3001` with `admin/admin` after starting the stack.

- `AVAILABILITY`: confirms backend scrape and runtime health.
- `API P95 LATENCY`: primary latency comparison for baseline vs final traffic windows.
- `ERROR RATE`: confirms whether new validation paths create expected `4xx` without `5xx` regressions.
- `Service Request Volume`: verifies benchmark traffic volume and DB activity.
- `Endpoint Performance Snapshot`: compares dataset/auth/telemetry route families.
- `Correlation / Analytics APIs`: tracks analytics request status and volume.
- `ThingSpeak Ingestion`: tracks ingestion stability after ThingSpeak ownership changes.
- `Database Query Activity`: verifies dataset lifecycle operations do not create DB failure spikes.
- `Container CPU Usage` and `Container Memory Usage`: show runtime overhead of the final stack.

## Better/Worse Interpretation

The final implementation is better if these conditions hold during the same workload:

- Availability remains at or near 100% with all core containers healthy.
- `5xx` error rate remains 0% or does not increase against equivalent valid requests.
- p95 latency stays within the demo threshold for health, dataset listing, metrics, and analysis endpoints.
- Dataset delete/restore/recently-deleted workflows succeed through the real backend instead of mocked frontend state.
- Analytics and correlation failures return stable `400`/`422` contract errors instead of unstructured internal failures.
- Container CPU/memory remains stable during benchmark windows without repeated restarts.

The final implementation may show more `4xx` responses than the baseline because stronger validation intentionally rejects invalid input. Treat expected `400`/`422` validation responses as contract correctness, not performance regression.

## Current Evidence-Based Conclusion

Based on PR 177 content and existing benchmark evidence, the final implementation is better in functional completeness, validation reliability, dataset lifecycle safety, analytics contract clarity, and dashboard usability. Performance must be confirmed by running the benchmark commands and capturing Grafana panels over the same traffic window.

The main performance parameters entitled by the final implementation are p95 API latency, request volume, error rate split by `4xx`/`5xx`, analytics duration, DB query duration, ingestion duration, container CPU, container memory, service health, and restart count.
