# Backend Overview
Intelligent IoT Data Management – Backend

## Overview
The backend is a Node.js + Express server designed to ingest, store, analyse, and serve IoT sensor data.
It follows a clean Controller → Service → Repository architecture and integrates with a PostgreSQL database for persistent storage.
The backend supports real‑time ingestion from ThingSpeak, CSV ingestion, JWT authentication, and dataset‑based API endpoints used by the frontend dashboard. For onboarding, see the Backend Onboarding Document in 'Backend/docs'.

## Backend Architecture
- The backend is structured into modular layers to ensure maintainability and scalability:
- Routes – define API endpoints
- Controllers – handle HTTP requests/responses
- Services – business logic
- Repositories – database queries
- Data Ingestion – ThingSpeak + CSV ingestion
- Authentication – JWT, bcrypt, RBAC
- Database Layer – PostgreSQL schema + queries
- This structure ensures each layer has a single responsibility and can be extended independently

## Key Features Implemented
1. Authentication
- JWT‑based login and registration
- Bcrypt password hashing
- Role‑Based Access Control (RBAC)
- Protected routes with middleware
- Account lockout on repeated failures

2. Database Layer (PostgreSQL)
- datasets table for dataset metadata
- timeseries table (wide format) for CSV + ThingSpeak ingestion
- Automatic dataset creation during ingestion
- Efficient wide‑format storage for fast dashboard queries

3. Ingestion Pipelines
- ThingSpeak ingestion (field1–field8)
- CSV ingestion (same wide‑format structure)
- Preview mode for ThingSpeak channels
- Unified ingestion logic across both sources

4. API Endpoints. View 'Backend/docs'.

## Project Structure
```
backend/
│
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── dataIngestion/
│   ├── db/
│   └── utils/
│
├── docs/
│   ├── Authentication Document
│   ├── Database Implementation Documentation
│   ├── Contract With Frontend
│   └── Threat Modelling Document
│
├── server.js
├── package.json
└── schema.sql
```

To Run the Backend Locally, view 'Backend/docs/' Backend Onboarding Document pdf.