import { Link } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = ({ title, subtitle, children }) => {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link to="/" className="dashboard-brand">
            IoT Sensors Dashboard
          </Link>
          <p className="dashboard-subtitle">
            {subtitle || 'Time-series Sensor Data and Correlation Analysis'}
          </p>
          {title && <h2 className="dashboard-page-title">{title}</h2>}
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">{children}</div>
      </main>
      <footer className="dashboard-footer">
        <div className="dashboard-footer-inner">
          <p>© 2026 Intelligent IoT Data Management</p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;