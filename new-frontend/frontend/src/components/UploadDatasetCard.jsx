const UploadDatasetCard = ({ onClick }) => {
  return (
    <button
      type="button"
      className="upload-dataset-card"
      onClick={onClick}
    >
      <div className="upload-icon">+</div>

      <h3>Upload Dataset</h3>

      <p>
        Upload a CSV file to create a new dataset.
      </p>
    </button>
  );
};

export default UploadDatasetCard;