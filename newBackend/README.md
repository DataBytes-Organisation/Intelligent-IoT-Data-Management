# BackendPrototype

Databytes – Intelligent IoT Data Management (MVP)

This MVP lets you:

upload time-series CSVs into PostgreSQL,

fetch series via an Express API,

visualise multiple streams in React with anomaly flags.

1) Prerequisites

Node.js 18+ and npm

PostgreSQL 14+ (server), psql (CLI), and optionally pgAdmin

A terminal (PowerShell on Windows, Terminal on macOS/Linux)

2) Repo layout (relevant parts)

/frontend          # Vite + React app
/newBackend        # Express API
/sql/schema.sql    # DB schema (datasets, timeseries_long)
/datasets          # (local CSVs for ingest; gitignored)
/mappings          # (optional mapping JSONs per dataset)

3) Database setup (PostgreSQL)

Open psql and run (adjust password as needed):

# from repo root (adjust path if needed)
psql -U app -d appdb -h localhost -f sql/schema.sql
# if using the 'postgres' superuser instead:
# psql -U postgres -d appdb -h localhost -f sql/schema.sql


appdb=# CREATE DATABASE appdb 
appdb=# \c appdb 
appdb=# \i C:\Users\Dell\Downloads\schema.sql 
appdb=# \dt 
appdb=# SELECT * FROM timeseries_long Limit 10; 
appdb=# SELECT * FROM datasets Limit 10; 

You should now have tables:

- datasets (id, name)

- timeseries_long (id, dataset_id, ts, metric, value, quality_flag)

4) Backend (Express API)

cd newBackend
npm install

Edit newBackend/.env to match your DB:
PGHOST=localhost
PGPORT=5432
PGDATABASE=appdb
PGUSER=app        # or postgres
PGPASSWORD=app    # or your postgres password
PORT=3000

Start the API:
npm run dev   # if nodemon is configured
# or
node server.js

Key endpoints

GET /api/datasets
→ list available datasets (e.g., sensor1, sensor2)

GET /api/datasets/:id/meta
→ fields + time bounds for a dataset

GET /api/series?datasetId=...&stream=...&interval=raw&from=...&to=...
→ time series rows. For interval=raw, each item includes:
{ "ts": "...", "value": 12.34, "quality_flag": true }

5) Frontend (React + Vite)
cd frontend
npm install
npm run dev

7) Anomalies (quality flag)

quality_flag is boolean:

true = normal (green dot in chart)

false = anomaly (red dot in chart)

Frontend colors dots based on *_quality fields from the API.

Data Science can update flags later without any API changes, e.g.:

8) Typical workflow (quick start)

DB: create appdb, run sql/schema.sql.

Backend: set .env, npm install, node server.js.

Ingest: load 1–2 CSVs into datasets/timeseries_long.

Frontend: npm run dev, open dataset page (e.g., /dashboard/sensor1).

Select streams + interval (raw for flags) + time range → Analyse.

See lines + green/red dots (when flags exist). 

