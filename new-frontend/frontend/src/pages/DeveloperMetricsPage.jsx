import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeveloperMetrics from "../components/DeveloperMetrics";
import { getSensorData } from "../services/sensorService";

const DeveloperMetricsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [apiResponseHistory, setApiResponseHistory] = useState([]);

  useEffect(() => {
    if (!id) return;

    let active = true;
    let intervalId;

    const measureResponseTime = async () => {
      try {
        const startTime = performance.now();

        await getSensorData(id);

        const endTime = performance.now();

        const responseTime = parseFloat(
          (endTime - startTime).toFixed(2)
        );

        if (!active) return;

        setApiResponseHistory((prev) => {
          if (prev.length >= 10) {
            return prev;
          }

          const updated = [...prev, responseTime];

          if (updated.length >= 10 && intervalId) {
            clearInterval(intervalId);
          }

          return updated;
        });
      } catch (error) {
        console.error("Response time test failed:", error);
      }
    };

    // First request immediately
    measureResponseTime();

    // Then one request every 10 seconds
    intervalId = setInterval(() => {
      measureResponseTime();
    }, 10000);

    return () => {
      active = false;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id]);

  const apiTrendData = apiResponseHistory.map(
    (responseTime, index) => ({
      test: `Request ${index + 1}`,
      responseTime,
    })
  );

  return (
    <div>
      <button
        className="developer-back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back to Dashboard
      </button>

      <DeveloperMetrics apiTrendData={apiTrendData} />
    </div>
  );
};

export default DeveloperMetricsPage;