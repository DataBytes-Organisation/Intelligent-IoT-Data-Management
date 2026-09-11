import axios from "axios";
import {
  getAccessToken,
  refreshSession,
} from "./authClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const datasetClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const createDataset = async (payload) => {
  let token = getAccessToken();

  if (!token) {
    const refreshed = await refreshSession();
    token = refreshed.data?.accessToken;
  }

  try {
    const response = await datasetClient.post("/datasets", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === "ACCESS_TOKEN_EXPIRED"
    ) {
      const refreshed = await refreshSession();
      const refreshedToken = refreshed.data?.accessToken;

      const retryResponse = await datasetClient.post("/datasets", payload, {
        headers: {
          Authorization: `Bearer ${refreshedToken}`,
        },
      });

      return retryResponse.data;
    }

    throw error;
  }
};