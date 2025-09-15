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
    <div className=" p-6 max-w-sm w-full mx-auto">
      <h3 className="text-xl text-left font-semibold text-gray-800 mb-4 border-b pb-2">
        {stream}
      </h3>
      <ul className="space-y-2 text-gray-700">
        <li className="flex justify-between">
          <span>Count:</span>
          <span className="font-medium">{stats.count}</span>
        </li>
        <li className="flex justify-between">
          <span>Min:</span>
          <span className="font-medium">{stats.min}</span>
        </li>
        <li className="flex justify-between">
          <span>Max:</span>
          <span className="font-medium">{stats.max}</span>
        </li>
        <li className="flex justify-between">
          <span>Average:</span>
          <span className="font-medium">{stats.avg}</span>
        </li>
      </ul>
    </div>
  );
};

export default StreamStats;
