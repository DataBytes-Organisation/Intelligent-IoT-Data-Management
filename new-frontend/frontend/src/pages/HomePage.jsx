import DatasetCard from "../components/DatasetCard";
import "./HomePage.css";

const datasets = [
  {
    id: "sensor1",
    name: "Sensor 1",
    description:
      "Temperature and environmental sensor data for time-series analysis.",
    streams: 3,
    lastUpdated: "Today",
  },
  {
    id: "sensor2",
    name: "Sensor 2",
    description:
      "Multi-stream dataset for monitoring patterns and correlations.",
    streams: 4,
    lastUpdated: "Today",
  },
  {
    id: "sensor3",
    name: "Sensor 3",
    description:
      "IoT sensor dataset used for dashboard testing and visualisation.",
    streams: 3,
    lastUpdated: "Today",
  },
];

const HomePage = () => {
  return (
    <div className="homepage">
      <section className="homepage__hero">
        <div className="homepage__hero-badge">
          Intelligent IoT Data Management Platform
        </div>

        <h1 className="homepage__hero-title">IoT Sensors Dashboard</h1>

        <p className="homepage__hero-subtitle">
          Monitor, analyse, and explore IoT sensor data through interactive
          dashboards, time-series visualisations, and correlation insights.
        </p>
      </section>

      <section className="homepage__datasets">
        <div className="homepage__section-header">
          <h2>Available Sensor Datasets</h2>
          <p>
            Select a dataset to open its dashboard and explore the available
            streams.
          </p>
        </div>

        <div className="homepage__grid">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.id} {...dataset} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;