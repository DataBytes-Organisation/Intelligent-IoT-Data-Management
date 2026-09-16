import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeveloperMetrics from "../components/DeveloperMetrics";
import { useSensorData } from "../hooks/useSensorData";

const DeveloperMetricsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { apiResponseHistory } = useSensorData(id);

  const apiTrendData = apiResponseHistory.map((responseTime, index) => ({
    test: `Request ${index + 1}`,
    responseTime,
  }));

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