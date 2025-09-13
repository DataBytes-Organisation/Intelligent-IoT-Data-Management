import { Link } from 'react-router-dom';

const datasets = [
  { id: 'sensor1', name: 'Sensor 1' },
  { id: 'sensor2', name: 'Sensor 2' },
  { id: 'sensor3', name: 'Sensor 3' },
];

const HomePage = () => (
  <div>
    <h2>Available Sensor Datasets</h2>
    <ul>
      {datasets.map(ds => (
        <li key={ds.id}>
          <Link to={`/dashboard/${ds.id}`}>{ds.name}</Link>
        </li>
      ))}
    </ul>
  </div>
);

export default HomePage;
