-- ============================================================
-- Analytics Alert Persistence
-- Stores generated analytics alerts permanently in PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth_users(id)
        ON DELETE CASCADE,

    dataset_id INTEGER
        REFERENCES datasets(id)
        ON DELETE SET NULL,

    alert_timestamp TIMESTAMPTZ NOT NULL,

    alert_type TEXT NOT NULL
        CHECK (
            alert_type IN (
                'POINTWISE_ANOMALY',
                'CORRELATION_CHANGE'
            )
        ),

    target JSONB NOT NULL,

    method TEXT NOT NULL,

    score DOUBLE PRECISION,

    score_metadata JSONB,

    severity TEXT,

    message TEXT NOT NULL,

    time_window JSONB,

    supporting_values JSONB,

    source JSONB NOT NULL,

    -- Preserve the complete original alert contract.
    alert_data JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Retrieve a user's alerts efficiently.
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_user_created
    ON analytics_alerts (user_id, created_at DESC);

-- Retrieve alerts associated with a dataset.
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_dataset_timestamp
    ON analytics_alerts (dataset_id, alert_timestamp DESC);

-- Filter alerts by type and event time.
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_type_timestamp
    ON analytics_alerts (alert_type, alert_timestamp DESC);
