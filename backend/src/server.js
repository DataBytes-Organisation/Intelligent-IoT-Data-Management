//handles server setup and configuration for the Express backend

// Load backend/.env consistently regardless of the command working directory.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

// Your CSR routing structure (datasets, series, timestamps, analyse, etc.)
const apiRouter = require('./routes'); // loads index.js inside /routes

// Upstream routes
const mockRoutes = require('./routes/mock');
const thingSpeakRoutes = require('./routes/thingspeak');
const authRoutes = require('./routes/auth');


const { startThingSpeakPolling } = require('./services/thingspeakService');

// Debug-only imports (commented out for production)
/// const authMiddleware = require("./middleware/authMiddleware");
/// const { hashPassword, comparePassword } = require("./utils/hashUtils");
/// const { generateToken } = require("./utils/tokenUtils");

const app = express();

app.use(cors());
app.use(express.json());

// Root ping
// Liveness probe used by demo smoke tests and deployment checks.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime()
  });
});

// Readiness probe checks required config and database connectivity.
app.get('/ready', async (req, res) => {
  const requiredEnv = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return res.status(503).json({
      status: 'not_ready',
      code: 'READY_ENV_MISSING',
      missing
    });
  }

  try {
    const pool = require('./db/pool');
    await pool.query('SELECT 1 AS ready_check');

    return res.status(200).json({
      status: 'ready'
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not_ready',
      code: 'READY_DEPENDENCY_UNAVAILABLE'
    });
  }
});

/* ---------------------------------------------------------
   DEBUG ROUTES (COMMENTED OUT FOR PRODUCTION)
   --------------------------------------------------------- */

/// // TEST: bcrypt hashing
/// app.get("/api/hash-test", async (req, res) => {
///   const password = "test123";
///   const hash = await hashPassword(password);
///   res.json({ password, hash });
/// });

/// // TEST: bcrypt compare
/// app.get("/api/compare-test", async (req, res) => {
///   const password = "test123";
///   const wrong = "wrong123";
///
///   const hash = await hashPassword(password);
///
///   const match = await comparePassword(password, hash);
///   const wrongMatch = await comparePassword(wrong, hash);
///
///   res.json({ match, wrongMatch });
/// });

/// // TEST: generate JWT
/// app.get("/api/test-token", (req, res) => {
///   const token = generateToken({ id: 1, role: "admin" });
///   res.json({ token });
/// });

/// // PROTECTED ROUTE TEST
/// app.get("/api/protected", authMiddleware, (req, res) => {
///   res.json({
///     message: "Access granted",
///     user: req.user,
///   });
/// });

/* ---------------------------------------------------------
   END DEBUG ROUTES
   --------------------------------------------------------- */

// Mount original API routes (datasets, series, timestamps, analyse, etc.)
app.use('/api', apiRouter);

// Mount UPSTREAM routes (auth, mock, thingspeak)
app.use('/api', authRoutes);
app.use('/api', mockRoutes);
app.use('/api', thingSpeakRoutes);

// Start server only when this file is run directly; tests import the app.
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    if (process.env.DISABLE_THINGSPEAK_POLLING !== 'true') {
      startThingSpeakPolling();
    }
  });
}

module.exports = app;
