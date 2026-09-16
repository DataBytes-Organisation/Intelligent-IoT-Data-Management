const crypto = require("crypto");

/**
 * Temporary compatibility identity for the current frontend, which does not
 * yet send Bearer tokens for dataset operations.
 *
 * TODO(FE auth migration): remove this middleware and restore authMiddleware
 * once the frontend sends authenticated requests with a real user identity.
 */
function legacyDatasetIdentityMiddleware(req, res, next) {
  const ownerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  if (!ownerId) {
    return res.status(500).json({
      error: {
        code: "DATASET_CONFIGURATION_ERROR",
        message: "THINGSPEAK_DATASET_OWNER_ID is required for dataset requests.",
      },
      meta: {
        requestId: req.get("x-request-id") || `req_${crypto.randomUUID()}`,
      },
    });
  }

  req.user = { sub: ownerId, role: "legacy" };
  return next();
}

module.exports = legacyDatasetIdentityMiddleware;
