const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured`);
  return value;
}

function getAuthConfig() {
  // Never silently sign production credentials with a known development value.
  const jwtSecret = isProduction
    ? required("JWT_SECRET")
    : process.env.JWT_SECRET;
  if (!jwtSecret)
    throw new Error(
      "JWT_SECRET must be configured before authentication is used",
    );
  return {
    jwtSecret,
    accessTokenSeconds: Number(process.env.ACCESS_TOKEN_SECONDS || 900),
    sessionSeconds: Number(process.env.SESSION_SECONDS || 43200),
    rememberMeSeconds: Number(process.env.REMEMBER_ME_SECONDS || 2592000),
    otpSeconds: Number(process.env.OTP_SECONDS || 600),
    resetSeconds: Number(process.env.RESET_SECONDS || 1800),
    secureCookies: isProduction,
  };
}

function assertProductionAuthConfig() {
  if (isProduction) {
    getAuthConfig();
    required("FRONTEND_ORIGIN");
    required("MAIL_FROM");
  }
}

module.exports = { getAuthConfig, assertProductionAuthConfig };
