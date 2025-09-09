-- 1) Datasets
CREATE TABLE IF NOT EXISTS datasets (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Long-format readings (works for any columns)
CREATE TABLE IF NOT EXISTS timeseries_long (
  id           BIGSERIAL PRIMARY KEY,
  dataset_id   INT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  entity       TEXT,                    -- sensor/device id (nullable)
  metric       TEXT NOT NULL,           -- e.g., field/measurement name
  ts           TIMESTAMPTZ NOT NULL,    -- UTC timestamp
  value        DOUBLE PRECISION,        -- numeric value
  quality_flag TEXT NOT NULL DEFAULT 'ok'
               CHECK (quality_flag IN ('ok','imputed','missing'))
);
CREATE INDEX IF NOT EXISTS idx_ts_long_ds_metric_ts ON timeseries_long(dataset_id, metric, ts);
CREATE INDEX IF NOT EXISTS idx_ts_long_ds_entity_ts ON timeseries_long(dataset_id, entity, ts);

-- 3) (Optional) Store anomaly results
CREATE TABLE IF NOT EXISTS anomalies (
  id          BIGSERIAL PRIMARY KEY,
  dataset_id  INT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  entity      TEXT,
  metric      TEXT NOT NULL,
  ts          TIMESTAMPTZ NOT NULL,
  value       DOUBLE PRECISION,
  score       DOUBLE PRECISION NOT NULL,
  label       TEXT,
  algo_version TEXT,
  params      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_anoms_ds_metric_ts ON anomalies(dataset_id, metric, ts);
