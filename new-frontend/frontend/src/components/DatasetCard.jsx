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
}) => {
  return (
    <article className="dataset-card">
      <div>
        <div className="dataset-card__header">
          <div className="dataset-card__icon">{icon}</div>
          <span className="dataset-card__status">{status}</span>
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