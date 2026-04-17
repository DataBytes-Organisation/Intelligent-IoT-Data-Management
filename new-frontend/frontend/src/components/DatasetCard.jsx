import { Link } from "react-router-dom";
import "./DatasetCard.css";

const DatasetCard = ({ id, name, description, streams, lastUpdated }) => {
  return (
    <div className="dataset-card">
      <div className="dataset-card__top">
        <h3>{name}</h3>
        <p>{description}</p>
      </div>

      <div className="dataset-card__meta">
        <span><strong>Streams:</strong> {streams}</span>
        <span><strong>Updated:</strong> {lastUpdated}</span>
      </div>

      <Link to={`/dashboard/${id}`} className="dataset-card__button">
        View Dashboard
      </Link>
    </div>
  );
};

export default DatasetCard;