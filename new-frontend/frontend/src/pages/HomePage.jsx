import DatasetCard from "../components/DatasetCard";
import "./HomePage.css";

const datasets = [
  {
    id: "sensor1",
    name: "Sensors 1",
    description: "Temperature and environmental sensor data for time-series analysis.",
    streams: 3,
    lastUpdated: "Today",
  },
  {
    id: "sensor2",
    name: "Sensor 2",
    description: "Multi-stream dataset for monitoring patterns and correlations.",
    streams: 4,
    lastUpdated: "Today",
  },
  {
    id: "sensor3",
    name: "Sensor 3",
    description: "IoT sensor dataset used for dashboard testing and visualisation.",
    streams: 3,
    lastUpdated: "Today",
  },
];

const HomePage = () => {
  return (
    <div className="homepage">
      <section className="homepage__hero">
        <div className="homepage__hero-content">
          <p className="homepage__eyebrow">Intelligent IoT Data Management Platform</p>
          <h1>Monitor, Analyse, and Explore IoT Sensor Data</h1>
          <p className="homepage__subtitle">
            Access sensor datasets, explore time-series behaviour, and navigate
            into interactive dashboards for correlation and anomaly analysis.
          </p>
        </div>
      </section>

      <section className="homepage__datasets">
        <div className="homepage__section-header">
          <h2>Available Sensor Datasets</h2>
          <p>Select a dataset to open its dashboard and explore the data.</p>
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