# IoT Backend - Ready Submission

This repository contains a cleaned Controller-Service-Repository (CSR) Node.js backend for the Intelligent IoT Data Management project.
Files included provide a working structure, ingestion script, and DB pool configuration.

## Quick start

1. Install dependencies:
   ```
   npm install
   ```

2. Configure Postgres in `.env` or edit `src/db/pool.js` to match your DB.

3. Run DB (example Docker):
   ```
   docker run --name appdb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=typescript.postgre -e POSTGRES_DB=appdb -p 5432:5432 -d postgres:15
   ```

4. Ingest CSV:
   ```
   node src/scripts/injest.js <datasetName> <metric> <csvFilePath>
   ```

5. Start server:
   ```
   npm start
   ```

## Endpoints
- `GET /health`
- `GET /api/datasets`
- `GET /api/datasets/:id/meta`
- `GET /api/series?datasetId=&stream=&interval=raw|5min|15min|1h|6h&from=&to=`

