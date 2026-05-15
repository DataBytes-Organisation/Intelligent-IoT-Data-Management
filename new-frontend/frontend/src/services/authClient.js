import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async ({ email, password }) => {
  const response = await authClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const verifyTwoFactorCode = async ({ email, otp, tempToken }) => {
  const response = await authClient.post("/auth/verify-2fa", {
    email,
    otp,
    tempToken,
  });

  return response.data;
};

export const resendTwoFactorCode = async ({ email, tempToken }) => {
  const response = await authClient.post("/auth/resend-2fa", {
    email,
    tempToken,
  });

  return response.data;
};

export const registerUser = async ({ fullName, email, password }) => {
  const response = await authClient.post("/auth/register", {
    fullName,
    email,
    password,
  });

  return response.data;
};

export const saveAuthSession = ({ token, user }) => {
  sessionStorage.setItem("iot_auth", "true");

  if (token) {
    sessionStorage.setItem("iot_token", token);
  }

  if (user) {
    sessionStorage.setItem("iot_user", JSON.stringify(user));
  }
};

export const clearAuthSession = () => {
  sessionStorage.removeItem("iot_auth");
  sessionStorage.removeItem("iot_token");
  sessionStorage.removeItem("iot_user");
  localStorage.removeItem("isAuthenticated");
};