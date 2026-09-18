import "./ConfirmDeleteDialog.css";

const ConfirmDeleteDialog = ({ datasetName, isDeleting, error, onCancel, onConfirm }) => {
  return (
    <div className="confirm-delete-overlay" role="dialog" aria-modal="true">
      <div className="confirm-delete-card">
        <h3>Delete this dataset?</h3>

        <p className="confirm-delete-name">"{datasetName}"</p>

        <p>
          All synced data will be permanently deleted and cannot be recovered.
        </p>

        <p>
          Your dataset settings and field mappings can be restored within 15
          days, but you will need to sync your data again.
        </p>

        <p className="confirm-delete-question">Do you want to continue?</p>

        {error && <p className="confirm-delete-error">{error}</p>}

        <div className="confirm-delete-actions">
          <button
            type="button"
            className="confirm-delete-cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirm-delete-yes"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;