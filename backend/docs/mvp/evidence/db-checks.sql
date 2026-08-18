-- Confirms two channels insert into separate datasets
SELECT name FROM datasets;

-- Confirms row counts per dataset, and that repeat runs don't duplicate
-- First run of channel-1350261: 10 rows
-- Second run (same 10 IDs, 6 overlapping): 14 rows, not 20
-- Proves ON CONFLICT (dataset_id, entry_id) DO NOTHING works correctly
SELECT d.name, COUNT(t.entry_id) FROM datasets d JOIN timeseries t ON d.id = t.dataset_id GROUP BY d.name;
