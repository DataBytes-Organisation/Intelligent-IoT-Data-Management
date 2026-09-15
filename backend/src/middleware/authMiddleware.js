const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getAuthConfig } = require("../config/authConfig");
module.exports = (req, res, next) => {
  const value = req.get("authorization");
  const fail = (code, message) =>
    res
      .status(401)
      .json({
        error: { code, message },
        meta: {
          requestId: req.get("x-request-id") || `req_${crypto.randomUUID()}`,
        },
      });
  if (!value || !value.startsWith("Bearer "))
    return fail("UNAUTHENTICATED", "Authentication is required.");
  try {
    req.user = jwt.verify(value.slice(7), getAuthConfig().jwtSecret);
    return next();
  } catch (error) {
    return fail(
      error.name === "TokenExpiredError"
        ? "ACCESS_TOKEN_EXPIRED"
        : "UNAUTHENTICATED",
      "Authentication is required.",
    );
  }
};
