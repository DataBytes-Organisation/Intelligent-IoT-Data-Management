# Data API Contract Gap Notes

## Purpose

This document records the known differences between the proposed V1 Data API Contract and the current backend implementation.

The V1 contract remains the source of truth for frontend integration. These notes are only for backend follow-up work and transitional frontend adapter decisions.

## Summary

The current backend exposes several data routes, but many responses still return raw arrays or simple error objects instead of the V1 response envelope.

Analytics and alert routes are also not fully implemented yet.

## Current Backend Gaps

| Area | V1 contract requirement | Current backend status | Required follow-up |
|---|---|---|---|
| Dataset list | `GET /api/datasets` returns V1 `{ data, meta }` envelope | Returns raw dataset array | Backend should wrap response in V1 envelope |
| Dataset series | `GET /api/datasets/:name/series` returns dataset metadata and series rows in V1 envelope | Returns raw series array | Backend should wrap response and include dataset metadata |
| Series filters | Filter endpoint validates stream names and returns V1 success/error responses | Basic validation only; returns raw filtered array | Backend should return V1 errors and metadata |
| Analytics | `POST /api/analyse` returns persisted/real analytics result | Placeholder echo response | Complete after BDAI-10 |
| Latest alerts | `GET /api/alerts/latest` returns latest alert collection | Route not implemented | Complete after BDAI-11 |
| Alert history | `GET /api/alerts/history` returns paginated alert history | Route not implemented | Complete after BDAI-11 |
| Error responses | Standard `{ error: { code, message, fields }, meta }` envelope | Current backend often returns `{ error: "message" }` | Backend should standardize errors |
| Authentication failures | Protected routes return standard auth failure responses | Most data routes are not currently protected | Confirm protection rules with BE/Auth team |