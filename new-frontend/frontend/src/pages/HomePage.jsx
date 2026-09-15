import { useState } from "react";
import DatasetCard from "../components/DatasetCard";
import UploadDatasetCard from "../components/UploadDatasetCard";
import UploadDatasetDialog from "../components/UploadDatasetDialog";
import { useDatasets } from "../hooks/useDatasets";
import "./HomePage.css";

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
  const {
  datasets,
  loading,
  error,
  refreshDatasets,
} = useDatasets();
  const [showUploadDialog,setShowUploadDialog] = useState(false);
  const streamCount = datasets.reduce(
    (total, dataset) => total + Number(dataset.streams || 0),
    0,
  );

  const renderDatasets = () => {
    if (loading) {
      return (
        <div className="homepage__dataset-state" role="status">
          <span className="homepage__spinner" aria-hidden="true"></span>
          <h3>Loading datasets</h3>
          <p>Please wait while the dataset library is prepared.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="homepage__dataset-state homepage__dataset-state--error" role="alert">
          <h3>Unable to load datasets</h3>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }

    if (datasets.length === 0) {
      return (
        <div className="homepage__dataset-state">
          <h3>No datasets available</h3>
          <p>New sensor datasets will appear here when they are added.</p>
        </div>
      );
    }

    return (
      <div className="homepage__grid">
        {datasets.map((dataset) => (
          <DatasetCard key={dataset.id} {...dataset} />
        ))}

        <UploadDatasetCard
        onClick={() => setShowUploadDialog(true)}
         />
      </div>
    );
  };

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
                <strong>{loading ? "—" : datasets.length}</strong>
                <span>Datasets</span>
              </div>
              <div className="homepage__stat-card">
                <strong>{loading ? "—" : streamCount}</strong>
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

          {renderDatasets()}
        </section>

        <section className="homepage__features" id="platform-info">
          {features.map((feature) => (
            <div className="homepage__feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>

        {showUploadDialog && (
          <UploadDatasetDialog
            onClose={() => {
              setShowUploadDialog(false);
              refreshDatasets();
            }}
          />
          )}
      </main>
    </>
  );
};

export default HomePage;
