# MVP Tracker: Backend-to-Analytics Mismatch Log

**Investigated by:** Bramuel Korofia Bukhuni (Junior Lead, Backend / API Integration)
**Related ticket:** Check whether current stored data can already be transformed into correlation and anomaly service inputs

## Method

Investigation was done by reading the actual backend and correlation_alert source code directly, rather than relying only on documentation, and by running real ingestion against ThingSpeak channel 12397 to confirm findings against live data.

## Findings

### 1. /api/analyse is a non-functional stub

backend/src/controllers/analyseController.js and backend/src/services/analyseService.js show the endpoint currently just echoes back whatever payload it receives ("Analysis completed (placeholder)"). It does not call the correlation_alert service or perform any real analysis, despite documentation implying it already returns correlation/variance results.

### 2. Two inconsistent storage formats exist

Wide-format ThingSpeak data (timeseries table) uses generic field1-field8 columns. Long-format CSV data (timeseries_long table) already stores a real metric name per row. These are structurally different and would need to be handled differently by any downstream consumer.

### 3. Field-name mapping system exists but is unused

backend/datasetsMapping/*.json contains a renames field intended to map generic names to real ones, but all three existing files (sensor1, sensor2, sensor3) have empty renames: {}. No mapping file exists for thingspeak-live, the dataset actually used by live ingestion.

### 4. A second, separate field mapping exists, hardcoded and partial

backend/src/services/thingSpeakService.js contains working hardcoded logic mapping field4 to temperature, field3 to humidity, field6 to pressure, confirmed correct against ThingSpeak's own channel metadata for channel 12397. Covers only 3 of 8 available fields, and is specific to this one test channel's layout; would not generalize to a different sensor channel without code changes.

### 5. previewThingSpeak.js is broken

Calls a function fetchThingSpeakFeeds that does not exist in thingSpeakService.js's exports. Confirmed by reading both files; likely a leftover from a prior rename.

### 6. Ingestion script usage does not match documentation

Onboarding docs describe usage as node thingSpeakInjest.js <channelId>. The actual script requires <datasetName> <apiUrl>, a label and a full ThingSpeak API URL. Confirmed by reading the script directly and successfully running it with the corrected format.

### 7. Correlation service input requirements, assessed, partially compatible

Confirmed via correlation_alert/testing/run_real_dataset.py and its output real_alerts.json that the correlation service accepts generic field names (field1...field8) directly as selected_streams and produces valid results. Input is a CSV file upload, not a direct JSON/DB row, so a transformation step (DB row to CSV) is still required even though field renaming is not strictly mandatory.

### 8. Anomaly service input requirements, assessed, undocumented

No API contract, endpoint, or request/response format could be found for the anomaly detection service, unlike correlation, which has a clear Flask endpoint. Anomaly detection code appears to exist as standalone scripts rather than an exposed service. This needs clarification from whoever owns the Models/Data Science team before backend integration work can begin on this side.

### 9. Missing dependency in package.json

thingSpeakInjest.js requires node-fetch, which was not listed in package.json. A fresh npm install does not pull this in, causing a Cannot find module error for any new team member setting up the project.

## Open Question for Senior Lead

Should backend proceed building the anomaly-service connector without a documented contract, or should this be raised with the Models/Data Science team first to define one, similar to what already exists for correlation?

## Status Summary

- Sample payload prepared: Yes, see evidence/api-samples.json
- Correlation input assessed: Yes, structurally compatible with a required DB-to-CSV transformation step
- Anomaly input assessed: Yes, assessment complete; finding is that no contract currently exists
- Mismatches logged: Yes, 9 findings recorded above


## Ingestion Path Decision

I compared the two ways we pull ThingSpeak data into the database.

**Service poller** (`src/services/thingspeakService.js`)
- Starts by itself when the server starts
- Runs every 15 seconds automatically
- Tries again if a request fails (has retry logic)
- Already tested and working, real data confirmed saved

**Manual script** (`src/dataIngestion/thingSpeakInjest.js`)
- Has to be run by hand
- No retry if something fails
- You have to type the full web address in yourself
- Had a missing dependency bug we found and fixed earlier

**Decision: the service poller is the approved path for MVP.**

I marked the manual script as testing-only with a comment at the top of the file. It is not removed, since it's still useful for quick manual checks, but it should not be used for the real MVP demo or production.

**Known issue found while testing**: the poller reports `savedCount: 10` on every run, even when the same entry_ids repeat across polls. Since duplicates should be silently skipped by the database, this number looks like it is counting attempts, not new rows actually saved. Worth fixing later, not blocking for now.

**Evidence**: see `evidence/ingestion.log`, four real polls captured, showing the service poller running and saving data successfully.