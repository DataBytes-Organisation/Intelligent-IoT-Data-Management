const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const users = require("../repositories/userRepository");
const store = require("../repositories/authRepository");
const email = require("./emailService");
const { getAuthConfig } = require("../config/authConfig");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const now = () => Date.now();
const expires = (seconds) => new Date(now() + seconds * 1000).toISOString();
const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role });
const fail = (code, message, status = 400, fields) => {
  const e = new Error(message);
  Object.assign(e, { code, status, fields });
  throw e;
};
function validatePassword(password, confirmPassword) {
  const fields = {};
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  )
    fields.password =
      "Use 12-128 characters with upper, lower, number and symbol.";
  if (confirmPassword !== undefined && password !== confirmPassword)
    fields.confirmPassword = "Passwords do not match.";
  if (Object.keys(fields).length)
    fail("VALIDATION_ERROR", "One or more fields are invalid.", 400, fields);
}
function validateEmail(value) {
  const email = users.normaliseEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail("VALIDATION_ERROR", "One or more fields are invalid.", 400, {
      email: "Enter a valid email address.",
    });
  return email;
}
async function createSession(user, rememberMe) {
  const cfg = getAuthConfig();
  const token = crypto.randomBytes(48).toString("base64url");
  await store.add("sessions", {
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash: hash(token),
    expiresAt: expires(rememberMe ? cfg.rememberMeSeconds : cfg.sessionSeconds),
    rememberMe: !!rememberMe,
    createdAt: new Date().toISOString(),
  });
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    cfg.jwtSecret,
    { expiresIn: cfg.accessTokenSeconds },
  );
  return {
    refreshToken: token,
    data: {
      accessToken,
      expiresInSeconds: cfg.accessTokenSeconds,
      user: publicUser(user),
    },
    rememberMe: !!rememberMe,
    maxAge: rememberMe ? cfg.rememberMeSeconds * 1000 : undefined,
  };
}
async function register({ email: emailValue, password, confirmPassword }) {
  const emailValueNormalised = validateEmail(emailValue);
  validatePassword(password, confirmPassword);
  if (await users.findUserByEmail(emailValueNormalised))
    fail("ACCOUNT_EXISTS", "An account already exists for this email.", 409);
  return publicUser(
    await users.createUser({
      id: crypto.randomUUID(),
      email: emailValueNormalised,
      password_hash: await bcrypt.hash(password, 12),
    }),
  );
}
async function login({ email: emailValue, password, rememberMe = false }) {
  const emailValueNormalised = validateEmail(emailValue);
  if (typeof rememberMe !== "boolean")
    fail("VALIDATION_ERROR", "One or more fields are invalid.", 400, {
      rememberMe: "Must be true or false.",
    });
  const user = await users.findUserByEmail(emailValueNormalised);
  if (!user || !(await bcrypt.compare(password || "", user.password_hash)))
    fail("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  if (user.mfaEnabled) {
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const challenge = {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: hash(otp),
      expiresAt: expires(getAuthConfig().otpSeconds),
      attempts: 0,
      resendAfter: expires(60),
      rememberMe,
      usedAt: null,
    };
    await store.add("challenges", challenge);
    await email.send({ to: user.email, purpose: "mfa", secret: otp });
    return {
      mfa: {
        mfaChallengeId: challenge.id,
        expiresInSeconds: getAuthConfig().otpSeconds,
        delivery: "email",
      },
      otp,
    };
  }
  return { session: await createSession(user, rememberMe) };
}
async function verifyMfa({ mfaChallengeId, otp, rememberMe }) {
  const challenge = await store.find("challenges", mfaChallengeId);
  if (!challenge || challenge.usedAt)
    fail("OTP_INVALID", "The verification code is invalid.");
  if (new Date(challenge.expiresAt) <= now())
    fail("OTP_EXPIRED", "The verification code has expired.");
  if (challenge.attempts >= 5)
    fail("OTP_ATTEMPTS_EXCEEDED", "Too many verification attempts.", 429);
  if (!/^\d{6}$/.test(otp || "") || hash(otp) !== challenge.tokenHash) {
    await store.update("challenges", challenge.id, {
      attempts: challenge.attempts + 1,
    });
    fail("OTP_INVALID", "The verification code is invalid.");
  }
  await store.update("challenges", challenge.id, {
    usedAt: new Date().toISOString(),
  });
  return createSession(await users.findUserById(challenge.userId), rememberMe);
}
async function resendMfa({ mfaChallengeId }) {
  const challenge = await store.find("challenges", mfaChallengeId);
  if (!challenge || challenge.usedAt || new Date(challenge.expiresAt) <= now())
    fail("OTP_EXPIRED", "The verification code has expired.");
  const retry = Math.ceil(
    (new Date(challenge.resendAfter).getTime() - now()) / 1000,
  );
  if (retry > 0) {
    const e = new Error("Please wait before requesting another code.");
    Object.assign(e, {
      code: "OTP_RESEND_THROTTLED",
      status: 429,
      retryAfterSeconds: retry,
    });
    throw e;
  }
  const user = await users.findUserById(challenge.userId);
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const replacement = {
    ...challenge,
    id: crypto.randomUUID(),
    tokenHash: hash(otp),
    expiresAt: expires(getAuthConfig().otpSeconds),
    attempts: 0,
    resendAfter: expires(60),
    usedAt: null,
  };
  await store.update("challenges", challenge.id, {
    usedAt: new Date().toISOString(),
  });
  await store.add("challenges", replacement);
  await email.send({ to: user.email, purpose: "mfa", secret: otp });
  return {
    mfaChallengeId: replacement.id,
    expiresInSeconds: getAuthConfig().otpSeconds,
    retryAfterSeconds: 60,
    delivery: "email",
    otp,
  };
}
async function refresh(token) {
  const session = token && (await store.findByHash("sessions", hash(token)));
  if (!session || session.revokedAt || new Date(session.expiresAt) <= now())
    fail("SESSION_EXPIRED", "Your session has expired.", 401);
  await store.update("sessions", session.id, {
    revokedAt: new Date().toISOString(),
  });
  return createSession(
    await users.findUserById(session.userId),
    session.rememberMe,
  );
}
async function logout(token) {
  const session = token && (await store.findByHash("sessions", hash(token)));
  if (session && !session.revokedAt)
    await store.update("sessions", session.id, {
      revokedAt: new Date().toISOString(),
    });
}
async function requestReset({ email: emailValue }) {
  const emailValueNormalised = validateEmail(emailValue);
  const user = await users.findUserByEmail(emailValueNormalised);
  if (!user) return;
  const token = crypto.randomBytes(32).toString("base64url");
  await store.add("resets", {
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash: hash(token),
    expiresAt: expires(getAuthConfig().resetSeconds),
    usedAt: null,
  });
  await email.send({
    to: user.email,
    purpose: "password-reset",
    secret: token,
  });
  return token;
}
async function confirmReset({ token, password, confirmPassword }) {
  validatePassword(password, confirmPassword);
  const reset = token && (await store.findByHash("resets", hash(token)));
  if (!reset || reset.usedAt)
    fail("RESET_TOKEN_INVALID", "The reset token is invalid.");
  if (new Date(reset.expiresAt) <= now())
    fail("RESET_TOKEN_EXPIRED", "The reset token has expired.");
  await users.updateUserById(reset.userId, {
    password_hash: await bcrypt.hash(password, 12),
  });
  await store.update("resets", reset.id, { usedAt: new Date().toISOString() });
  await store.revokeUserSessions(reset.userId);
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
  getAllUsers: users.getSafeUsers,
};
