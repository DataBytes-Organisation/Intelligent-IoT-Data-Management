import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import './HomePage.css';

const datasets = [
  { id: 'sensor1', name: 'Sensor 1' },
  { id: 'sensor2', name: 'Sensor 2' },
  { id: 'sensor3', name: 'Sensor 3' },
];

const HomePage = () => {
  return (
    <DashboardLayout title="Available Sensor Datasets">
      <div className="home-page">
        <p className="home-description">
          Select a dataset to open its dashboard and view sensor streams,
          statistics, and correlation analysis.
        </p>

        <div className="dataset-list">
          {datasets.map((ds) => (
            <Link key={ds.id} to={`/dashboard/${ds.id}`} className="dataset-link-card">
              {ds.name}
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;