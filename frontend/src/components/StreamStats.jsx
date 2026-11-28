import { useState } from "react";
import AnalyticsMiniChart from "./AnalyticsMiniChart.jsx";


const getStats = (data, stream) => {
  const values = data
    .map((d) => parseFloat(d[stream]))
    .filter((v) => !Number.isNaN(v));

  if (values.length === 0) {
    return {
      count: 0,
      min: "-",
      max: "-",
      avg: "-",
      stdDev: "-",
    };
  }

  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / count;

  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - avg, 2),
      0,
    ) / count;

  const stdDev = Math.sqrt(variance);

  return {
    count,
    min,
    max,
    avg: avg.toFixed(2),
    stdDev: stdDev.toFixed(2),
  };
};

const StreamStats = ({
  data,
  stream,
  displayName,
  colorIndex,
  onChartClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  const stats = getStats(data, stream);

  const formatValue = (value) => {
    if (value === "-") {
      return "-";
    }

    const number = Number(value);

    return Number.isNaN(number)
      ? value
      : number.toFixed(2);
  };

  return (
    <div
      className={`insight-card stream-insight-card ${
        expanded ? "stream-insight-card--expanded" : ""
      }`}
    >
      <h3 className="insight-stream-name">
        {displayName}
      </h3>

      <AnalyticsMiniChart
        data={data}
        stream={stream}
        displayName={displayName}
        colorIndex={colorIndex}
        onClick={onChartClick}
      />

      <div className="insight-average-row">
        <div>
          <span className="insight-average-label">
            Average
          </span>

          <strong className="insight-average-value">
            {formatValue(stats.avg)}
          </strong>
        </div>

        <span className="insight-record-count">
          {stats.count} records
        </span>
      </div>

      <div
        className={`insight-details-wrapper ${
          expanded ? "insight-details-wrapper--open" : ""
        }`}
      >
        <div className="insight-details-inner">
          <div className="insight-divider"></div>

          <div className="insight-expanded-stats">
            <div className="insight-stat">
              <span className="metric-title">Min</span>
              <strong className="metric-value">
                {formatValue(stats.min)}
              </strong>
            </div>

            <div className="insight-stat">
              <span className="metric-title">Max</span>
              <strong className="metric-value">
                {formatValue(stats.max)}
              </strong>
            </div>

            <div className="insight-stat">
              <span className="metric-title">Count</span>
              <strong className="metric-value">
                {stats.count}
              </strong>
            </div>

            <div className="insight-stat">
              <span className="metric-title">Variability</span>
              <strong className="metric-value">
                {formatValue(stats.stdDev)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="insight-details-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide details" : "View details"}
        <span
          className={`insight-details-arrow ${
            expanded ? "insight-details-arrow--expanded" : ""
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>
    </div>
  );
};

export default StreamStats;