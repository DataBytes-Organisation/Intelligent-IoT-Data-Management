import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  // Needed if your backend uses cookies/sessions (CORS must allow credentials)
  withCredentials: import.meta.env.VITE_AUTH_MODE === "cookie",
});

// Attach JWT if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
