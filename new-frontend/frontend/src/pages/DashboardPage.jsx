// pages/DashboardPage.jsx

import { useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import "./DashboardPage.css";

const DashboardPage = () => {
  const { id: datasetName } = useParams();

  return (
    <main className="dashboard-page-shell">
      <section className="dashboard-page-hero">
        <div className="dashboard-page-badge">Sensor Dashboard</div>
        <h1>{datasetName} Dashboard</h1>
        <p>
          Explore time-series data, stream behaviour, correlations and summary
          insights in one structured view.
        </p>
      </section>

      <Dashboard datasetName={datasetName} />
    </main>
  );
};

export default DashboardPage;