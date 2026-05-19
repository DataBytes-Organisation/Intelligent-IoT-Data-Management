const getStats = (data, stream) => {
  const values = data
    .map((d) => parseFloat(d[stream]))
    .filter((v) => !isNaN(v));
  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / count;

  return { count, min, max, avg: avg.toFixed(2) };
};

const StreamStats = ({ data, stream }) => {
  const stats = getStats(data, stream);

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{stream}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Count:</span>
          <span className="font-medium">{stats.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Min:</span>
          <span className="font-medium">{stats.min}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Max:</span>
          <span className="font-medium">{stats.max}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Average:</span>
          <span className="font-medium">{stats.avg}</span>
        </div>
      </div>
    </div>
  );
};

export default StreamStats;
