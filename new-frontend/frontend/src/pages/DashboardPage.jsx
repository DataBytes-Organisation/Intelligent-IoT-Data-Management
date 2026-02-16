import { useParams } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import DashboardLayout from '../layouts/DashboardLayout';

const DashboardPage = () => {
  const { id } = useParams(); // e.g. 'sensor1'

  return (
    <div className="min-h-screen">
      {/* page container centered */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white text-center">
          Dashboard for <span className="font-bold">{id}</span>
        </h2>

        {/* center the dashboard content */}
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-5xl">
            <Dashboard datasetId={id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
