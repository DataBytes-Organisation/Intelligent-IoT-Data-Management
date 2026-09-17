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

export const deleteDataset = async (datasetId) => {
  let token = getAccessToken();

  if (!token) {
    const refreshed = await refreshSession();
    token = refreshed.data?.accessToken;
  }

  try {
    const response = await datasetClient.delete(`/datasets/${datasetId}`, {
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

      const retryResponse = await datasetClient.delete(
        `/datasets/${datasetId}`,
        {
          headers: {
            Authorization: `Bearer ${refreshedToken}`,
          },
        },
      );

      return retryResponse.data;
    }

    throw error;
  }
};

// function to get deleted datasets, so we can show it on the recently deleted tab
export const getDeletedDatasets = async () => {
  let token = getAccessToken();

  if (!token) {
    const refreshed = await refreshSession();
    token = refreshed.data?.accessToken;
  }

  try {
    const response = await datasetClient.get("/datasets", {
      params: {
        status: "deleted",
      },
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

      const retryResponse = await datasetClient.get("/datasets", {
        params: {
          status: "deleted",
        },
        headers: {
          Authorization: `Bearer ${refreshedToken}`,
        },
      });

      return retryResponse.data;
    }

    throw error;
  }
};