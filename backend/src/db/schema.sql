-- Core schema for Intelligent IoT Data Management
-- Fresh database installations use this file
-- Existing databases use migrations in src/db/migrations/

BEGIN;

-- 1. Authentication users table (must exist before datasets references it)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Datasets metadata table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  timestamp_field TEXT,
  created_by UUID NOT NULL REFERENCES auth_users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth_users(id),
  data_deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);

-- Partial unique index: allow same owner to reuse name after soft-delete
CREATE UNIQUE INDEX idx_datasets_active_by_owner ON datasets (created_by, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_datasets_deleted_at ON datasets (deleted_at);

-- 3. Long-format time-series table
CREATE TABLE IF NOT EXISTS timeseries_long (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value DOUBLE PRECISION,
  entry_id INTEGER,
  ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timeseries_long_dataset_ts ON timeseries_long (dataset_id, ts DESC);
CREATE INDEX idx_timeseries_long_entry ON timeseries_long (dataset_id, entry_id);

-- 4. Wide-format time-series table
CREATE TABLE IF NOT EXISTS timeseries (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  entry_id INTEGER NOT NULL,
  field1 DOUBLE PRECISION,
  field2 DOUBLE PRECISION,
  field3 DOUBLE PRECISION,
  field4 DOUBLE PRECISION,
  field5 DOUBLE PRECISION,
  field6 DOUBLE PRECISION,
  field7 DOUBLE PRECISION,
  field8 DOUBLE PRECISION,
  ts TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dataset_id, entry_id)
);

CREATE INDEX idx_timeseries_dataset_ts ON timeseries (dataset_id, ts DESC);

COMMIT;
