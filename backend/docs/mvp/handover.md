# AFIR-02 Frontend Integration Handover

## Overview

AFIR-02 reviewed the active frontend dashboard to identify its current mock-data dependencies and compare them with backend capabilities already available in the project.

This task is an audit only. No frontend or backend implementation changes were made.

## Current Frontend Behaviour

The active dashboard is accessed through:

`/dashboard/:id`

`DashboardPage.jsx` receives the dataset ID from the route and passes it to the Dashboard component.

The Dashboard currently loads sensor data using:

`useSensorData(true)`

Because mock mode is enabled, `useSensorData.js` loads:

`src/data/sensorData1.json`

instead of retrieving the selected dataset from the backend.

As a result, selecting a dataset does not currently cause the dashboard sensor widgets to retrieve that dataset's live database-backed time-series data.

## Dashboard Dependencies Reviewed

The following dashboard functionality was reviewed:

- Sensor data loading
- Stream discovery
- Time-range extraction
- Time and entry filtering
- Interval sampling
- Stream statistics
- Correlation analysis
- Scatter plots
- Most-correlated-pair analysis
- Line charts

Most of these components operate on data supplied to them and are not inherently restricted to mock data.

Their current mock dependency originates primarily from the Dashboard's initial data source.

## Existing Backend Integration Candidates

The strongest existing live-data candidate is:

`GET /api/datasets/:name/series`

The backend describes this route as the main controller for real sensor/time-series data.

The associated timeseries service supports both wide-format ThingSpeak data and long-format CSV data converted into wide-format entries.

The returned structure includes:

- `created_at`
- `entry_id`
- dynamic metric fields

This is broadly compatible with the structure currently consumed by the dashboard.

Additional relevant backend capability includes:

`GET /api/datasets/:name/timestamps`

This returns timestamps for a selected dataset and could support future time-range integration.

`POST /api/datasets/:name/series/filter`

This supports filtering dataset series by selected metric names.

## Existing Mock-Oriented Backend Routes

The project also contains:

- `GET /api/streams`
- `GET /api/stream-names`
- `POST /api/filter-streams`
- `GET /api/data-profile`
- `POST /api/top-correlated-pair`

These routes are associated with the existing mock/processed-data service path.

They should not be assumed to provide dataset-aware database integration without further implementation work.

## Analysis Endpoint

`POST /api/analyse` currently exists, but its service is a placeholder.

It returns the received payload with an analysis-completed message and does not currently perform real statistical or machine-learning analysis.

## Main Integration Gaps

1. Dashboard data loading is explicitly configured for mock mode.

2. The selected dashboard dataset is not currently used to load the corresponding backend time-series data.

3. Dataset-aware backend APIs exist but are not wired into the active dashboard data-loading flow.

4. Some analytical backend endpoints remain tied to the mock-data path rather than a selected database dataset.

5. The generic analyse endpoint is not yet a real analysis implementation.

## Recommended Follow-Up

Future integration work should connect the dashboard's selected dataset to the dataset-aware series API while preserving the existing frontend data contract.

Any replacement of frontend-side filtering, statistics or correlation logic should be handled as separate implementation work and tested against the expected frontend response structure.

AFIR-02 does not make those implementation changes.