import { useState } from "react";
import DatasetCard from "../components/DatasetCard";
import UploadDatasetCard from "../components/UploadDatasetCard";
import UploadDatasetDialog from "../components/UploadDatasetDialog";
import { useDatasets } from "../hooks/useDatasets";
import { deleteDataset } from "../services/datasetService";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
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
  removeDataset,
} = useDatasets();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteClick = (dataset) => {
    setPendingDelete(dataset);
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteDataset(pendingDelete.id);
      removeDataset(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(
        err.message || "Something went wrong while deleting. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };
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
          <DatasetCard
            key={dataset.id}
            {...dataset}
            onDeleteClick={handleDeleteClick}
          />
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

            <div className="homepage__dataset-tabs">
              <button
                type="button"
                className={`homepage__dataset-tab ${
                  !showRecentlyDeleted
                    ? "homepage__dataset-tab--active"
                    : ""
                }`}
                onClick={() => setShowRecentlyDeleted(false)}
              >
                Available Sensor Datasets
              </button>

              <button
                type="button"
                className={`homepage__dataset-tab ${
                  showRecentlyDeleted
                    ? "homepage__dataset-tab--active"
                    : ""
                }`}
                onClick={() => setShowRecentlyDeleted(true)}
              >
                Recently Deleted
              </button>
            </div>

            <p>
              {showRecentlyDeleted
                ? "View datasets that have been recently deleted."
                : "Select a dataset to open its dashboard and explore available streams, trends, and analytical outputs."}
            </p>
          </div>

          {showRecentlyDeleted ? (
            <div className="homepage__dataset-state">
                <div className="homepage__deleted-icon" aria-hidden="true">
                <span className="homepage__bin-handle"></span>
                <span className="homepage__bin-lid"></span>
                <span className="homepage__bin-body">
                  <span></span>
                  <span></span>
                </span>
              </div>

              <h3>No deleted datasets</h3>

              <p>There are currently no deleted datasets available.</p>
            </div>
          ) : (
            renderDatasets()
          )}
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

        {pendingDelete && (
          <ConfirmDeleteDialog
            datasetName={pendingDelete.name}
            isDeleting={isDeleting}
            error={deleteError}
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />
        )}
      </main>
    </>
  );
};

export default HomePage;
