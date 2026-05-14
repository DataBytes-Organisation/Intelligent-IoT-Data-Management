// REQUIRED FOR THE ENV VARIABLES INSIDE BACKEND FOLDER
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Route imports (CSR routing structure)
const mockRoutes = require("./routes/mock");
const thingSpeakRoutes = require("./routes/thingspeak");
const authRoutes = require("./routes/auth");

// Debug-only imports (commented out for production)
/// const authMiddleware = require("./middleware/authMiddleware");
/// const { hashPassword, comparePassword } = require("./utils/hashUtils");
/// const { generateToken } = require("./utils/tokenUtils");

const app = express();

app.use(cors());
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.send("Backend is running");
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

/// // TEMP MEMORY USER TEST
/// let user = null;

/// // REGISTER TEST
/// app.post("/api/register", async (req, res) => {
///   const { username, password } = req.body;
///
///   if (!username || !password) {
///     return res.status(400).json({ message: "Username and password required" });
///   }
///
///   const hashedPassword = await hashPassword(password);
///
///   user = { username, password: hashedPassword };
///
///   res.json({ message: "User registered" });
/// });

/// // LOGIN TEST
/// app.post("/api/login", async (req, res) => {
///   const { username, password } = req.body;
///
///   if (!user || user.username !== username) {
///     return res.status(401).json({ message: "User not found" });
///   }
///
///   const isMatch = await comparePassword(password, user.password);
///
///   if (!isMatch) {
///     return res.status(401).json({ message: "Invalid password" });
///   }
///
///   const token = generateToken({ username });
///   res.json({ token });
/// });

/* ---------------------------------------------------------
   END DEBUG ROUTES
   --------------------------------------------------------- */

// Mount real API routes
app.use("/api", authRoutes);
app.use("/api", mockRoutes);
app.use("/api", thingSpeakRoutes);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
