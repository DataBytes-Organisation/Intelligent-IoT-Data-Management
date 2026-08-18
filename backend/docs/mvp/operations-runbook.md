# Operations Runbook: ThingSpeak Ingestion

## Approved Path

The service poller is the only supported way to pull ThingSpeak data for the MVP.

File: src/services/thingspeakService.js
Started automatically from: src/server.js

## How to Run It

You do not run this by itself. It starts automatically when the backend server starts.

cd backend
npm install
npm start

Once running, you will see this in the terminal, confirming the approved path is active:

[MVP INGESTION PATH] Service poller started. This is the approved production path. Interval: 15000 ms

Every 15 seconds after that, you should see a new poll result like this:

ThingSpeak poll successful: {
  checkedAt: '...',
  channelId: 12397,
  feedCount: 10,
  savedCount: 10,
  datasetName: 'thingspeak-live',
  latestEntryId: ...
}

## Required .env Settings

DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=IoTDatabase

THINGSPEAK_CHANNEL_ID=12397
THINGSPEAK_RESULTS=10
THINGSPEAK_POLL_INTERVAL_MS=15000
THINGSPEAK_MAX_RETRIES=3
THINGSPEAK_RETRY_DELAY_MS=2000
THINGSPEAK_DATASET_NAME=thingspeak-live

## What NOT to Use

src/dataIngestion/thingSpeakInjest.js is a manual script, testing only. It is not part of the MVP path. It has been marked clearly at the top of the file.

## Known Issue

savedCount in the logs currently shows 10 even when the same rows are being re-fetched, not actually new. This looks like it is counting attempts, not real new saves. Not fixed yet, just noted here.

## Evidence

Real runtime proof is saved in evidence/ingestion.log.
## Testing a Second Channel (Multi-Dataset Support)

To ingest a second, independent channel:

node src/dataIngestion/thingSpeakInjest.js <dataset-name> "https://api.thingspeak.com/channels/<channel-id>/feeds.json?results=10"

Example used for testing: channel-1350261, channel ID 1350261.

To verify datasets are stored separately:

psql -U postgres -d IoTDatabase -c "SELECT d.name, COUNT(t.entry_id) FROM datasets d JOIN timeseries t ON d.id = t.dataset_id GROUP BY d.name;"

## Automated Tests

Run: npm test

Covers: missing channel ID error handling, successful data fetch, repeat-run duplicate prevention, and failure behaviour without data loss.
