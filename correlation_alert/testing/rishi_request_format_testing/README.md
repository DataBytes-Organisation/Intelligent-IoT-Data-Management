\# Correlation Request Format Testing

\#\# Overview

This folder contains the evidence collected while testing the Correlation Flask service.

\#\# Endpoint Tested

POST /detect-correlation-alert

\#\# Testing Completed

\- Tested CSV file upload using multipart/form-data.  
\- Tested JSON request format.  
\- Tested invalid request handling.  
\- Confirmed supported request formats.  
\- Documented configurable parameters and hardcoded settings.

\#\# Results

\- CSV request returned HTTP 200 OK.  
\- JSON request returned HTTP 200 OK.  
\- Invalid request returned HTTP 500 Internal Server Error.  
\- The service accepted both CSV and JSON requests.

\#\# Evidence Included

\- Exported Postman collection.  
\- Successful CSV request screenshot.  
\- Successful JSON request screenshot.  
\- Invalid request screenshot.

\#\# Notes

The service currently returns a 500 Internal Server Error for some invalid requests, indicating that request validation could be improved.  
