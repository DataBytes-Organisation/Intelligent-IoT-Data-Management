# Dashboard Sensor Mock Responses

## Valid Sensor Responses

### sensor1Response.json
Mock response for Dashboard Sensor 1.

### sensor2Response.json
Mock response for Dashboard Sensor 2.

### sensor3Response.json
Mock response for Dashboard Sensor 3.

Each response contains different sensor data so that different dashboard routes display different information.

## Edge Case Responses

### emptyResponse.json
Represents a successful request where no sensor data is available.

### invalidDataResponse.json
Represents invalid request parameters.

**Expected HTTP Status:** 400

**Error Code:** VALIDATION_ERROR

### errorResponse.json
Represents a backend or sensor service failure.

**Expected HTTP Status:** 503

**Error Code:** SERVICE_UNAVAILABLE

### insufficientDataResponse.json
Represents a situation where there is insufficient valid data to calculate a reliable correlation.

## Analytics Responses

### correlationResponse.json
Mock correlation response based on the Analytics API draft.

### alertResponse.json
Mock analytics alert response.

### noAlertsResponse.json
Represents a successful response with no alerts.

## Response Structure

Each valid sensor response contains:

- Dataset information
- Stream metadata
- Sensor readings
- Summary statistics
- Timestamp (`created_at`)
- Dataset identifier (`sensor1`, `sensor2`, `sensor3`)

## Data Rules

- Timestamps use `created_at` in UTC ISO-8601 format.
- Sensor readings are stored as JSON numbers or `null`.
- Stream names are obtained dynamically from the response metadata.
- Units are currently set to `null` until confirmed by the Backend/Data Ingestion team.
- Frontend should not infer units from stream names.
- Correlation and alert results should be provided by Analytics or Backend.
- Summary statistics included in these mock responses are for frontend development and testing.
- `sensor1`, `sensor2`, and `sensor3` are temporary mock dataset identifiers for frontend testing.
