import { useParams } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import DashboardLayout from '../layouts/DashboardLayout';

const DashboardPage = () => {
  const { id } = useParams();

  return (
    <DashboardLayout title={`Dashboard for ${id}`}>
      <Dashboard datasetId={id} />
    </DashboardLayout>
  );
};

export default DashboardPage;