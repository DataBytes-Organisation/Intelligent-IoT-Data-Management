import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import './HomePage.css';

const datasets = [
  { id: 'sensor1', name: 'Sensor 1' },
  { id: 'sensor2', name: 'Sensor 2' },
  { id: 'sensor3', name: 'Sensor 3' },
];

const HomePage = () => (
  <div className="home-page">
    <div className="home-header">
      <div>
        <h2>Available Sensor Datasets</h2>
        <p>Select a sensor dataset to view time-series and correlation analysis.</p>
      </div>

      <Link to="/profile-settings" className="home-profile-icon">
        <User size={26} />
      </Link>
    </div>

    <ul className="dataset-list">
      {datasets.map(ds => (
        <li key={ds.id}>
          <Link to={`/dashboard/${ds.id}`}>{ds.name}</Link>
        </li>
      ))}
    </ul>
  </div>
);

export default HomePage;