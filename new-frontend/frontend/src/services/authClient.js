import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

let accessToken = null;

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const registerUser = async ({ email, password, confirmPassword }) => {
  const response = await authClient.post("/auth/register", {
    email,
    password,
    confirmPassword,
  });

  return response.data;
};

export const loginUser = async ({ email, password, rememberMe }) => {
  const response = await authClient.post("/auth/login", {
    email,
    password,
    rememberMe,
  });

  return {
    status: response.status,
    ...response.data,
  };
};

export const verifyTwoFactorCode = async ({
  mfaChallengeId,
  otp,
  rememberMe,
}) => {
  const response = await authClient.post("/auth/mfa/verify", {
    mfaChallengeId,
    otp,
    rememberMe,
  });

  return response.data;
};

export const resendTwoFactorCode = async ({ mfaChallengeId }) => {
  const response = await authClient.post("/auth/mfa/resend", {
    mfaChallengeId,
  });

  return response.data;
};

export const refreshSession = async () => {
  const response = await authClient.post("/auth/refresh");

  const token = response.data?.data?.accessToken;
  setAccessToken(token);

  return response.data;
};

export const logoutUser = async () => {
  try {
    await authClient.post("/auth/logout", null, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });
  } finally {
    clearAccessToken();
  }
};

export const getAuthHeaders = () =>
  accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};