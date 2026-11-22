import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

let accessToken = null;
let refreshRequest = null;

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

export const verifyTwoFactorCode = async ({ mfaChallengeId, otp }) => {
  const response = await authClient.post("/auth/mfa/verify", {
    mfaChallengeId,
    otp,
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
  if (!refreshRequest) {
    refreshRequest = authClient
      .post("/auth/refresh")
      .then((response) => {
        const token = response.data?.data?.accessToken;
        setAccessToken(token);

        return response.data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

export const logoutUser = async () => {
  try {
    await authClient.post(
      "/auth/logout",
      {},
      {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      },
    );
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

export const authenticatedFetch = async (input, init = {}) => {
  let token = accessToken;
  if (!token) {
    await refreshSession();
    token = accessToken;
  }

  const makeRequest = (accessToken) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials || "include",
    });
  };

  let response = await makeRequest(token);
  if (response.status !== 401) return response;

  const error = await response.clone().json().catch(() => null);
  if (error?.error?.code !== "ACCESS_TOKEN_EXPIRED") return response;

  await refreshSession();
  response = await makeRequest(accessToken);
  return response;
};
