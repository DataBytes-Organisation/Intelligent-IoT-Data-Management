//handles server setup and configuration for the Express backend

require('dotenv').config({ path: '../.env' }); // Load .env from root

const express = require('express');
const cors = require('cors');

// Your CSR routing structure (datasets, series, timestamps, analyse, etc.)
const apiRouter = require('./routes'); // loads index.js inside /routes

// Upstream routes
const mockRoutes = require('./routes/mock');
const thingSpeakRoutes = require('./routes/thingspeak');
const authRoutes = require('./routes/auth');

// Debug-only imports (commented out for production)
/// const authMiddleware = require("./middleware/authMiddleware");
/// const { hashPassword, comparePassword } = require("./utils/hashUtils");
/// const { generateToken } = require("./utils/tokenUtils");

const app = express();

app.use(cors());
app.use(express.json());

// Root ping
app.get('/', (req, res) => {
  res.send('Backend is running');
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

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
