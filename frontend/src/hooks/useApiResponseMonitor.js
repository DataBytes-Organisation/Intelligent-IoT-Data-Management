import { useEffect, useState } from "react";
import { getSensorData } from "../services/sensorService";

const POLL_INTERVAL = 10000;
const MAX_ENTRIES = 10;

export const useApiResponseMonitor = (datasetId) => {
  const storageKey = `api-response-history:${datasetId}`;
  const statusKey = `api-server-status:${datasetId}`;

  const [history, setHistory] = useState(() => {
    if (!datasetId) return [];

    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  });

  const [serverStatus, setServerStatus] = useState(() => {
    if (!datasetId) return "checking";

    return localStorage.getItem(statusKey) || "checking";
  });

  useEffect(() => {
    if (!datasetId) return;

    let active = true;

    // Load existing history whenever dataset changes
    try {
      setHistory(
        JSON.parse(localStorage.getItem(storageKey)) || []
      );
    } catch {
      setHistory([]);
    }

    setServerStatus(
      localStorage.getItem(statusKey) || "checking"
    );

    const measureResponseTime = async () => {
      const startTime = performance.now();

      try {
        await getSensorData(datasetId);

        const responseTime = Number(
          (performance.now() - startTime).toFixed(2)
        );

        if (!active) return;

        setServerStatus("good");
        localStorage.setItem(statusKey, "good");

        setHistory((prev) => {
          const updated = [
            ...prev,
            {
              responseTime,
              checkedAt: new Date().toISOString(),
            },
          ].slice(-MAX_ENTRIES);

          localStorage.setItem(
            storageKey,
            JSON.stringify(updated)
          );

          return updated;
        });
      } catch (error) {
        if (!active) return;

        console.error("Response time check failed:", error);

        setServerStatus("down");
        localStorage.setItem(statusKey, "down");
      }
    };

    // Check immediately
    measureResponseTime();

    // Keep monitoring instead of stopping after 10
    const intervalId = setInterval(
      measureResponseTime,
      POLL_INTERVAL
    );

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [datasetId, storageKey, statusKey]);

  return {
    history,
    serverStatus,
  };
};