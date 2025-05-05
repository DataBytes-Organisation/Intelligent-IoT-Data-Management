-- User accounts and authentication credentials
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- BCrypt encrypted password
    mfa_secret VARCHAR(32),               -- TOTP secret for 2FA
    last_login TIMESTAMP,                 -- Timestamp of last successful login
    failed_attempts INT DEFAULT 0,        -- Consecutive failed login attempts
    account_locked BOOLEAN DEFAULT FALSE, -- Account lock status
    created_at TIMESTAMP DEFAULT NOW()    -- Account creation time
);

-- API access tokens for authenticated requests
CREATE TABLE api_tokens (
    token_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(512) NOT NULL,     -- Hashed JWT token
    scopes TEXT[] NOT NULL,               -- Array of permission scopes
    expires_at TIMESTAMP NOT NULL,       -- Token expiration time
    created_at TIMESTAMP DEFAULT NOW(),   -- Token issuance time
    CONSTRAINT valid_scopes CHECK (scopes <> '{}')
);

-- Enable Postgis extension for geography
CREATE EXTENSION IF NOT EXISTS postgis;

-- Registered IoT devices
CREATE TABLE devices (
    device_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,           -- Human-readable device name
    type VARCHAR(50) NOT NULL CHECK (type IN ('temperature', 'pressure', 'motion')),
    location GEOGRAPHY(POINT, 4326),      -- GPS coordinates (WGS84)
    registered_at TIMESTAMP DEFAULT NOW() -- Device registration time
);

-- Individual sensor data streams
CREATE TABLE sensor_streams (
    stream_id UUID PRIMARY KEY,
    device_id UUID REFERENCES devices(device_id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,     -- Measurement type (e.g., 'temperature')
    sampling_rate INT NOT NULL CHECK (sampling_rate > 0), -- Samples per second
    created_at TIMESTAMP DEFAULT NOW()    -- Stream creation time
);

-- Enable TimescaleDB extension for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Time-series sensor measurements
CREATE TABLE sensor_data (
    timestamp TIMESTAMPTZ NOT NULL,       -- Precise measurement time
    stream_id UUID REFERENCES sensor_streams(stream_id) ON DELETE CASCADE,
    value FLOAT NOT NULL,      -- Raw sensor reading
    normalized_value FLOAT,    -- Standardized value (Z-score)
    PRIMARY KEY (timestamp, stream_id)
);

SELECT create_hypertable(
    'sensor_data',
    'timestamp',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Optimize for time-range queries
CREATE INDEX idx_sensor_data_stream_time ON sensor_data (stream_id, timestamp DESC);

-- Correlation analysis results
CREATE TABLE correlations (
    correlation_id UUID PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,    -- Analysis window start
    window_end TIMESTAMPTZ NOT NULL,      -- Analysis window end
    stream_a UUID REFERENCES sensor_streams(stream_id),
    stream_b UUID REFERENCES sensor_streams(stream_id),
    coefficient FLOAT NOT NULL CHECK (coefficient BETWEEN -1 AND 1),
    algorithm VARCHAR(50) NOT NULL,       -- Correlation method used
    CONSTRAINT valid_stream_pair CHECK (stream_a <> stream_b)
);

-- Detected anomaly records
CREATE TABLE anomalies (
    anomaly_id UUID PRIMARY KEY,
    stream_id UUID REFERENCES sensor_streams(stream_id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ NOT NULL,     -- Time of detection
    anomaly_type VARCHAR(50) NOT NULL,    -- Classification of anomaly
    raw_value FLOAT NOT NULL,  -- Original sensor value
    confidence_score FLOAT NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'resolved'))
);

-- User-uploaded files
CREATE TABLE uploaded_files (
    file_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,  -- Original filename
    storage_path VARCHAR(512) NOT NULL,   -- Filesystem path
    format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'json', 'xlsx')),
    status VARCHAR(20) DEFAULT 'uploading' CHECK (status IN ('uploading', 'processed', 'failed')),
    uploaded_at TIMESTAMP DEFAULT NOW()   -- Upload timestamp
);

-- Chatbot conversation sessions
CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),   -- Conversation start time
    ended_at TIMESTAMP,                   -- Conversation end time
    escalation_level INT DEFAULT 0 CHECK (escalation_level IN (0, 1)) -- 0=bot, 1=human
);

-- Individual chat messages
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    content TEXT NOT NULL,                -- Message text
    is_bot BOOLEAN NOT NULL,              -- Whether message is from bot
    sent_at TIMESTAMP DEFAULT NOW()       -- Message timestamp
);

-- Optimize for message retrieval by session
CREATE INDEX idx_chat_messages_session ON chat_messages (session_id, sent_at);