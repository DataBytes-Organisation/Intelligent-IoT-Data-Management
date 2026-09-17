const auth = require("../services/authService");
const crypto = require("crypto");
const cookieOptions = (rememberMe) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
});
const requestId = (req) =>
  req.get("x-request-id") || `req_${crypto.randomUUID()}`;
function success(res, req, status, data) {
  res.set("Cache-Control", "no-store");
  return res.status(status).json({ data, meta: { requestId: requestId(req) } });
}
function error(res, req, err) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  if (status >= 500) {
    console.error("Authentication request failed", {
      requestId: requestId(req),
      route: req.originalUrl,
      method: req.method,
      error: err.message,
    });
  }
  const body = {
    error: {
      code,
      message: status === 500 ? "An unexpected error occurred." : err.message,
    },
    meta: { requestId: requestId(req) },
  };
  if (err.fields) body.error.fields = err.fields;
  if (err.retryAfterSeconds)
    body.error.retryAfterSeconds = err.retryAfterSeconds;
  return res.status(status).json(body);
}
function setSession(res, req, session) {
  res.cookie(
    "iot_refresh",
    session.refreshToken,
    cookieOptions(session.rememberMe),
  );
  return success(res, req, 200, session.data);
}
async function register(req, res) {
  try {
    return success(res, req, 201, { user: await auth.register(req.body) });
  } catch (err) {
    return error(res, req, err);
  }
}
async function login(req, res) {
  try {
    const result = await auth.login(req.body);
    if (result.mfa) return success(res, req, 202, result.mfa);
    return setSession(res, req, result.session);
  } catch (err) {
    return error(res, req, err);
  }
}
async function verifyMfa(req, res) {
  try {
    return setSession(res, req, await auth.verifyMfa(req.body));
  } catch (err) {
    return error(res, req, err);
  }
}
async function resendMfa(req, res) {
  try {
    const data = await auth.resendMfa(req.body);
    delete data.otp;
    return success(res, req, 202, data);
  } catch (err) {
    return error(res, req, err);
  }
}
async function refresh(req, res) {
  try {
    return setSession(res, req, await auth.refresh(req.cookies?.iot_refresh));
  } catch (err) {
    return error(res, req, err);
  }
}
async function logout(req, res) {
  try {
    await auth.logout(req.cookies?.iot_refresh);
    res.clearCookie("iot_refresh", cookieOptions(false));
    return res.status(204).end();
  } catch (err) {
    return error(res, req, err);
  }
}
async function requestReset(req, res) {
  try {
    await auth.requestReset(req.body);
    return success(res, req, 202, {
      message: "If the account exists, reset instructions have been sent.",
    });
  } catch (err) {
    return error(res, req, err);
  }
}
async function confirmReset(req, res) {
  try {
    await auth.confirmReset(req.body);
    return res.status(204).end();
  } catch (err) {
    return error(res, req, err);
  }
}
async function getUsers(req, res) {
  return success(res, req, 200, { users: await auth.getAllUsers() });
}
module.exports = {
  register,
  login,
  verifyMfa,
  resendMfa,
  refresh,
  logout,
  requestReset,
  confirmReset,
  getUsers,
};
