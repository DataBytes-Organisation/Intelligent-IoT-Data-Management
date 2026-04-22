import { useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import "./DashboardPage.css";

const DashboardPage = () => {
  const { id } = useParams();

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <h1>{id} Dashboard</h1>
        <p>Explore time-series data, correlations and insights</p>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <Dashboard datasetId={id} />
      </div>
    </div>
  );
};

export default DashboardPage;