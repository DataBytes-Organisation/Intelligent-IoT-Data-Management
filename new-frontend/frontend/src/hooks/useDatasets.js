import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const formatUpdatedTime = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
};

const buildDatasetCard = (dataset) => ({
  id: dataset.name,
  name:
    dataset.name === "thingspeak-live"
      ? "ThingSpeak Live"
      : dataset.name,
  icon: dataset.name === "thingspeak-live" ? "📡" : "📊",
  description:
    dataset.description ||
    (dataset.name === "thingspeak-live"
      ? "Live IoT sensor dataset for dashboard monitoring and analysis."
      : `${dataset.totalRows ?? 0} imported sensor records.`),
  streams: Array.isArray(dataset.mappings)
    ? dataset.mappings.length
    : 0,
  lastUpdated:
    dataset.name === "thingspeak-live"
      ? "Live"
      : formatUpdatedTime(dataset.updatedAt),
  status: "Available",
});

export const useDatasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/datasets`);

      if (!response.ok) {
        throw new Error(
          `Dataset request failed with status ${response.status}`
        );
      }

      const datasetList = await response.json();

      if (!Array.isArray(datasetList)) {
        throw new Error("Dataset response must be an array");
      }

      const detailedDatasets = await Promise.all(
        datasetList.map(async (dataset) => {
          const detailResponse = await fetch(
            `${API_BASE_URL}/datasets/${dataset.id}`
          );

          if (!detailResponse.ok) {
            return dataset;
          }

          return detailResponse.json();
        })
      );

      setDatasets(detailedDatasets.map(buildDatasetCard));
    } catch (requestError) {
      setDatasets([]);
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  return {
    datasets,
    loading,
    error,
    refreshDatasets: loadDatasets,
  };
};