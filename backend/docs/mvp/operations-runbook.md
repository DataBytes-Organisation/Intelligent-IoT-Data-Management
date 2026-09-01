# Backend and ThingSpeak Runtime Runbook

## Purpose

This document explains how I ran and tested the existing backend and ThingSpeak ingestion flow on Windows.

## Environment

- Operating system: Windows 11
- Code editor: Visual Studio Code
- Backend: Node.js
- Database: PostgreSQL
- Database tool: pgAdmin 4
- Git branch: `backend-heston-runtime-validation`

## Required Software

- Git
- Visual Studio Code
- Node.js and npm
- PostgreSQL
- pgAdmin 4

## Project Setup

Open the backend folder:

```cmd
cd C:\Users\hesto\Documents\Intelligent-IoT-Data-Management\backend
```

Install the required packages:

```cmd
npm install
```

## Environment Variables

The backend requires database and ThingSpeak settings in the local `.env` file.

Database variables:

- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

ThingSpeak variables:

- `THINGSPEAK_CHANNEL_ID`
- `THINGSPEAK_READ_API_KEY`
- `THINGSPEAK_RESULTS`
- `THINGSPEAK_POLL_INTERVAL_MS`
- `THINGSPEAK_MAX_RETRIES`
- `THINGSPEAK_RETRY_DELAY_MS`
- `THINGSPEAK_DATASET_NAME`

Passwords and API keys are not included in this document.

## Database Setup

I created a local PostgreSQL database named:

```text
IoTDatabase
```

I executed the following schema file using the pgAdmin Query Tool:

```text
src/db/schema.sql
```

The schema created:

- `datasets`
- `timeseries`
- `timeseries_long`

## Start the Backend

Run:

```cmd
npm start
```

The backend starts on:

```text
http://localhost:3000
```

## Final Runtime Result

The ThingSpeak polling interval was set to `15000 ms`.

The final test showed:

```text
ThingSpeak poll successful
channelId: 12397
feedCount: 10
savedCount: 10
datasetName: thingspeak-live
```

This confirmed that ten records were fetched from ThingSpeak and saved successfully into PostgreSQL.

## Issues Identified and Resolved

- `THINGSPEAK_CHANNEL_ID` was initially missing from `.env`.
- The PostgreSQL password was incorrect.
- The local `IoTDatabase` database needed to be created.
- The required database tables did not exist.
- The schema file was executed in pgAdmin to create the tables.
- PowerShell blocked npm scripts, so `npm.cmd` or Command Prompt was used.

## Runtime Evidence

The runtime output is stored in:

```text
docs/mvp/evidence/ingestion.log
```

The runtime log was captured using:

```cmd
npm.cmd start > docs\mvp\evidence\ingestion.log 2>&1
```

## Database Evidence

The database verification queries are stored in:

```text
docs/mvp/evidence/db-checks.sql
```

