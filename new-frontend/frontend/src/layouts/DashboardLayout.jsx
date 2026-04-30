const DashboardLayout = ({ title, subtitle, eyebrow, children }) => {
  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">IoT Sensors Dashboard</h1>
          <p className="app-subtitle">
            Time-series Sensor Data and Correlation Analysis
          </p>
        </header>

        <section className="page-intro">
          {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
          {title && <h2 className="page-title">{title}</h2>}
          {subtitle && <p className="page-description">{subtitle}</p>}
        </section>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;