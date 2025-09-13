const getStats = (data, stream) => {
  const values = data.map(d => parseFloat(d[stream])).filter(v => !isNaN(v));
  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / count;

  return { count, min, max, avg: avg.toFixed(2) };
};

const StreamStats = ({ data, stream }) => {
  const stats = getStats(data, stream);

  return (
    <div className="card">
      <h3>{stream}</h3>
      <ul>
        <li>Count: {stats.count}</li>
        <li>Min: {stats.min}</li>
        <li>Max: {stats.max}</li>
        <li>Average: {stats.avg}</li>
      </ul>
    </div>
  );
};

export default StreamStats;
