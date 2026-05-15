import DatasetCard from "../components/DatasetCard";
import "./HomePage.css";

const datasets = [
  {
    id: "sensor1",
    name: "Environmental Sensor",
    icon: "🌡️",
    description:
      "Collects temperature and humidity data over time, enabling analysis of environmental trends and conditions.",
    streams: 3,
    lastUpdated: "Today",
    status: "Available",
  },
  {
    id: "sensor2",
    name: "Multi-Stream Sensor",
    icon: "📊",
    description:
      "Captures multiple sensor streams simultaneously, supporting comparison and correlation between different variables.",
    streams: 4,
    lastUpdated: "Today",
    status: "Available",
  },
  {
    id: "sensor3",
    name: "IoT Monitoring Sensor",
    icon: "📡",
    description:
      "Provides real-time IoT sensor data used for dashboard testing, system validation, and visualisation of streaming data.",
    streams: 3,
    lastUpdated: "Today",
    status: "Available",
  },
];

const features = [
  {
    title: "Time-Series Visualisation",
    description:
      "Explore how sensor values change over time using interactive charts and filtering options.",
  },
  {
    title: "Correlation Analysis",
    description:
      "Compare multiple data streams to identify relationships and patterns between variables.",
  },
  {
    title: "Scalable UI Architecture",
    description:
      "Built using reusable components, enabling easy extension for new datasets and features.",
  },
];

const HomePage = () => {
  return (
    <>
      <main className="homepage">
        <section className="homepage__hero">
          <div className="homepage__hero-content">
            <div className="homepage__hero-badge">
              Intelligent IoT Data Management Platform
            </div>

            <h1 className="homepage__hero-title">
              Monitor IoT sensor data with clarity and confidence
            </h1>

            <p className="homepage__hero-subtitle">
              A structured dashboard platform for exploring time-series sensor
              streams, visualising trends, and preparing the system for
              correlation and anomaly insights.
            </p>

            <div className="homepage__hero-actions">
              <a href="#datasets" className="homepage__primary-btn">
                Explore Datasets
              </a>
              <a href="#platform-info" className="homepage__secondary-btn">
                View Project Info
              </a>
            </div>
          </div>

          <div className="homepage__hero-panel">
            <div className="homepage__panel-header">
              <span>System Overview</span>
              <span className="homepage__live-dot">Live-ready</span>
            </div>

            <div className="homepage__stats-grid">
              <div className="homepage__stat-card">
                <strong>3</strong>
                <span>Datasets</span>
              </div>
              <div className="homepage__stat-card">
                <strong>10+</strong>
                <span>Streams</span>
              </div>
              <div className="homepage__stat-card">
                <strong>24h</strong>
                <span>Analysis Window</span>
              </div>
            </div>

            <div className="homepage__mini-chart">
              <span style={{ height: "35%" }}></span>
              <span style={{ height: "55%" }}></span>
              <span style={{ height: "45%" }}></span>
              <span style={{ height: "75%" }}></span>
              <span style={{ height: "60%" }}></span>
              <span style={{ height: "90%" }}></span>
              <span style={{ height: "70%" }}></span>
            </div>
          </div>
        </section>

        <section className="homepage__datasets" id="datasets">
          <div className="homepage__section-header">
            <p className="homepage__section-label">Dataset Library</p>
            <h2>Available Sensor Datasets</h2>
            <p>
              Select a dataset to open its dashboard and explore available
              streams, trends, and analytical outputs.
            </p>
          </div>

          <div className="homepage__grid">
            {datasets.map((dataset) => (
              <DatasetCard key={dataset.id} {...dataset} />
            ))}
          </div>
        </section>

        <section className="homepage__features" id="platform-info">
          {features.map((feature) => (
            <div className="homepage__feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
};

export default HomePage;