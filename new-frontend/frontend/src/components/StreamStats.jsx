const getStats = (data, stream) => {
  const values = data
    .map((d) => parseFloat(d[stream]))
    .filter((v) => !isNaN(v));

  if (values.length === 0) {
    return {
      count: 0,
      min: '-',
      max: '-',
      avg: '-',
    };
  }

  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / count;

  return {
    count,
    min,
    max,
    avg: avg.toFixed(2),
  };
};

const StreamStats = ({ data, stream }) => {
  const stats = getStats(data, stream);

  const displayName =
    stream.charAt(0).toUpperCase() + stream.slice(1);

  const formatValue = (value) => {
    if (value === '-') return '-';

    const number = Number(value);

    return Number.isNaN(number)
      ? value
      : number.toFixed(2);
  };

  return (
    <div className="insight-card stream-insight-card">
      <h3 className="insight-stream-name">
        {displayName}
      </h3>

      <div className="insight-average-row">
        <strong className="insight-average-value">
          {formatValue(stats.avg)}
        </strong>

        <span className="insight-average-label">
          Average
        </span>
      </div>

      <div className="insight-divider"></div>

      <div className="insight-stats-row">
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
      </div>
    </div>
  );
};

export default StreamStats;