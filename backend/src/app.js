const express = require("express");
const cors = require("cors");
const { assertProductionAuthConfig } = require("./config/authConfig");
const apiRoutes = require("./routes");
const authRoutes = require("./routes/auth");
function cookieParser(req, _res, next) {
  req.cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))];
      }),
  );
  next();
}
function createApp() {
  assertProductionAuthConfig();
  const app = express();
  const origin = process.env.FRONTEND_ORIGIN;
  app.use(
    cors({ origin: origin ? origin.split(",") : true, credentials: true }),
  );
  app.use(express.json());
  app.use(cookieParser);
  app.get("/", (_req, res) => res.send("Backend is running"));
  app.get("/health", (_req, res) =>
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    }),
  );
  app.get("/ready", (_req, res) =>
    process.env.NODE_ENV === "production" && !process.env.JWT_SECRET
      ? res
          .status(503)
          .json({
            error: {
              code: "READY_DEPENDENCY_UNAVAILABLE",
              message: "Authentication configuration is unavailable.",
            },
          })
      : res.json({ status: "ready" }),
  );
  app.use("/api", apiRoutes);
  app.use("/api", authRoutes);
  return app;
}
module.exports = createApp();
module.exports.createApp = createApp;
