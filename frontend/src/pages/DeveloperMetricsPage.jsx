import { useNavigate, useParams } from "react-router-dom";
import DeveloperMetrics from "../components/DeveloperMetrics";
import { useApiResponseMonitor } from "../hooks/useApiResponseMonitor";

const DeveloperMetricsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { history } = useApiResponseMonitor(id);

  const apiTrendData = history.map((item, index) => ({
    test: `Request ${index + 1}`,
    responseTime: item.responseTime,
    checkedAt: item.checkedAt,
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
