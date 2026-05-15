const getStats = (data, stream) => {
  const values = data.map((d) => parseFloat(d[stream])).filter((v) => !isNaN(v));

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

  return (
    <div className="insight-card stream-insight-card">
      <div className="insight-card-header">
        <span className="insight-label">Selected Stream</span>
        <h3 className="insight-stream-name">{stream}</h3>
      </div>

      <div className="insight-metrics-grid">
        <div className="metric-box">
          <span className="metric-title">Min</span>
          <strong className="metric-value">{stats.min}</strong>
        </div>

        <div className="metric-box">
          <span className="metric-title">Max</span>
          <strong className="metric-value">{stats.max}</strong>
        </div>

        <div className="metric-box">
          <span className="metric-title">Average</span>
          <strong className="metric-value">{stats.avg}</strong>
        </div>

        <div className="metric-box">
          <span className="metric-title">Count</span>
          <strong className="metric-value">{stats.count}</strong>
        </div>
      </div>
    </div>
  );
};

export default StreamStats;