# IoT Data Management Project - Script Documentation

This documentation explains the purpose, usage, and examples for each of the custom scripts and modules implemented in this project.

---

## 1. `src/scripts/injest.js`

### Purpose
- Ingests **CSV time-series data** into the PostgreSQL database.
- Normalizes data into the `datasets` and `timeseries_long` tables.

### Expected CSV Format
```csv
ts,value,quality_flag
2025-09-14T10:00:00Z,22.5,good
2025-09-14T10:05:00Z,22.7,good
2025-09-14T10:10:00Z,30.1,anomaly
```

### Usage
```bash
node src/scripts/injest.js <datasetName> <metric> <csvFilePath>
```

### Example
```bash
node src/scripts/injest.js sensor1 temperature ./src/ingest/data/temp.csv
```

---

## 2. `src/mockModule.js`

### Purpose
- Provides mock API endpoints for **stream data**, **stream names**, and **filtered streams**.
- Reads from a pre-processed JSON file (`processedData.json`).
- Bundled CSR design (Controller, Service, Repository inside one file).

### API Endpoints
- `GET /api/streams` → Returns the full processed data.
- `GET /api/stream-names` → Returns available stream names.
- `POST /api/filter-streams` → Filters entries by stream names.

### Example `processedData.json`
```json
[
  { "streamName": "temperature", "ts": "2025-09-14T10:00:00Z", "value": 22.5 },
  { "streamName": "humidity", "ts": "2025-09-14T10:00:00Z", "value": 0.45 }
]
```

### Usage in `app.js`
```js
const express = require('express');
const createMockModule = require('./mockModule');

const app = express();
app.use(express.json());

const mockController = createMockModule();

app.get('/api/streams', mockController.getStreams);
app.get('/api/stream-names', mockController.getStreamNames);
app.post('/api/filter-streams', mockController.postFilterStreams);
```

---

## 3. `src/analyseModule.js`

### Purpose
- Provides an **analysis API endpoint** for handling payloads.
- Stub implementation: saves analysis payloads (currently logs them).
- Bundled CSR design (Controller, Service, Repository inside one file).

### API Endpoints
- `POST /api/analyse` → Receives an analysis payload, validates, and echoes back.

### Example Request
```http
POST /api/analyse
Content-Type: application/json

{
  "stream": "temperature",
  "window": "5min",
  "values": [22.5, 22.7, 30.1]
}
```

### Example Response
```json
{
  "ok": true,
  "data": {
    "received": {
      "stream": "temperature",
      "window": "5min",
      "values": [22.5, 22.7, 30.1]
    }
  }
}
```

### Usage in `app.js`
```js
const express = require('express');
const createAnalyseModule = require('./analyseModule');

const app = express();
app.use(express.json());

const analyseController = createAnalyseModule();

app.post('/api/analyse', analyseController.analyse);
```

---

## 4. `src/services/seriesService.js`

### Purpose
- Handles the **business logic** for fetching time-series data.
- Decides between **raw** queries and **bucketed aggregation** queries.
- Validates intervals and inputs.

### Used By
- `seriesController.js`

### Functions
- `getTimeSeries(filters)`
  - `filters = { datasetId, stream, interval, from, to }`
  - Validates inputs.
  - Queries the repository (`seriesRepository.js`).
  - Returns normalized result with metadata.

### Example Call
```js
const filters = {
  datasetId: 'sensor_dataset',
  stream: 'temperature',
  interval: '5min',
  from: '2025-09-14T00:00:00Z',
  to: '2025-09-14T06:00:00Z'
};

const result = await seriesService.getTimeSeries(filters);
console.log(result);
```

---
