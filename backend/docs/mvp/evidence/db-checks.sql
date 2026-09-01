-- Database verification for ThingSpeak ingestion
-- Author: Heston Daniel Joyston

-- Check the dataset created by the backend
SELECT *
FROM datasets;

-- Count the total number of records in the wide-format table
SELECT COUNT(*) AS total_rows
FROM timeseries;

-- Show the latest 10 records from the wide-format table
SELECT *
FROM timeseries
ORDER BY entry_id DESC
LIMIT 10;

-- Count the total number of records in the long-format table
SELECT COUNT(*) AS total_rows
FROM timeseries_long;
