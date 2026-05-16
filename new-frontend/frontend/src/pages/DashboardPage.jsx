import { useParams } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

const DashboardPage = () => {
  const { id } = useParams();

  return (
    <div className="dashboard-page-wrapper">
      <div className="dashboard-header">
        <h1>Correlation Analysis Dashboard</h1>
        <p>
          Analyse IoT sensor streams using time-series trends, scatter plots,
          and correlation insights.
        </p>

        <div className="dataset-badge">
          Dataset: {id}
        </div>
      </div>

      <Dashboard />
    </div>
  );
};

export default DashboardPage;