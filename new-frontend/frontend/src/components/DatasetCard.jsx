import { Link } from "react-router-dom";
import "./DatasetCard.css";

const DatasetCard = ({
  id,
  name,
  icon,
  description,
  streams,
  lastUpdated,
  status,
  onDeleteClick,
  isSystemDataset,
}) => {
  return (
    <article className="dataset-card">
      <div>
        <div className="dataset-card__header">
          <div className="dataset-card__icon">{icon}</div>

          <div className="dataset-card__header-right">
            <span className="dataset-card__status">{status}</span>

            {!isSystemDataset && (
              <button
              type="button"
              className="dataset-card__delete-btn"
              onClick={() => onDeleteClick({ id, name })}
              aria-label={`Delete ${name}`}
              title="Delete dataset"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
            )}
          </div>
        </div>

        <div className="dataset-card__top">
          <h3>{name}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div>
        <div className="dataset-card__meta">
          <span>
            <strong>Streams</strong>
            {streams}
          </span>
          <span>
            <strong>Updated</strong>
            {lastUpdated}
          </span>
        </div>

        <Link to={`/dashboard/${id}`} className="dataset-card__button">
          View Dashboard →
        </Link>
      </div>
    </article>
  );
};

export default DatasetCard;