import ApiResponseTrend from './ApiResponseTrend.jsx';

const DeveloperMetrics = ({ apiTrendData }) => {
  return (
    <div className="dashboard-page">
      <section className="dashboard-section">
        <h2>Developer Metrics</h2>

        <ApiResponseTrend data={apiTrendData} />
      </section>
    </div>
  );
};

export default DeveloperMetrics;