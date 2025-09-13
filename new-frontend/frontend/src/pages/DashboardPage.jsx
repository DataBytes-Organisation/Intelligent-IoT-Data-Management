import { useParams } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import DashboardLayout from '../layouts/DashboardLayout';

const DashboardPage = () => {
  const { id } = useParams(); // e.g. 'sensor1'

  return (
    <div>
      <h2>Dashboard for {id}</h2>
      <Dashboard datasetId={id} />
    </div>
  );
};

export default DashboardPage;
