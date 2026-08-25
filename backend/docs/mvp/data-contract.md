### 1. `datasets`
Purpose: Metadata lookup for active dataset collections.
Columns:
* `id`: `SERIAL` (Primary Key)
* `name`: `TEXT` (Unique, Not Null)

### 2. `timeseries_long`
Purpose: Long-format telemetry storage (one record per metric reading).
Columns:
* `id`: `SERIAL` (Primary Key)
* `dataset_id`: `INTEGER` (Foreign Key -> `datasets.id`, ON DELETE CASCADE)
* `entity`: `TEXT` (Entity/device identifier)
* `metric`: `TEXT` (Metric name, e.g., temperature, voltage)
* `ts`: `TIMESTAMP` (Timestamp of reading)
* `value`: `DOUBLE PRECISION`
* `quality_flag`: `TEXT`
Indexes: `idx_timeseries_dataset_metric`, `idx_timeseries_ts`, `idx_timeseries_entity`

### 3. `timeseries` 
Purpose: ThingSpeak style wide-format rows for multi-field streaming data.
Columns:
  * `dataset_id`: `INTEGER` (Foreign Key -> `datasets.id`, ON DELETE CASCADE)
  * `created_at`: `TIMESTAMPTZ` (Not Null)
  * `entry_id`: `INTEGER` (Not Null)
  * `field1` through `field8`: `DOUBLE PRECISION`
Primary Key: Composite `(dataset_id, entry_id)`


* **Evidence Script**: `backend/docs/mvp/evidence/db-checks.sql`