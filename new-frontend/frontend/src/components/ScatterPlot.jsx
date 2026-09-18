import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';

const ScatterPlot = ({ data, streams, title = 'Scatter Plot' }) => {
  const [xStream, yStream] = streams;
  const scatterData = data
    .map((entry) => ({ x: Number(entry[xStream]), y: Number(entry[yStream]) }))
    .filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y));

  return (
    <div className="scatter-card">
      <h4 className="scatter-title">{title}</h4>
      <div className="scatter-chart" role="img" aria-label={`${yStream} compared with ${xStream} scatter plot`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 14, bottom: 20, left: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={xStream}
              tick={{ fill: '#64748b', fontSize: 12 }}
              label={{ value: xStream, position: 'insideBottom', offset: -8, fill: '#334155', fontSize: 12, fontWeight: 700 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yStream}
              tick={{ fill: '#64748b', fontSize: 12 }}
              label={{ value: yStream, angle: -90, position: 'insideLeft', offset: 0, fill: '#334155', fontSize: 12, fontWeight: 700 }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name={`${xStream} vs ${yStream}`} data={scatterData} fill="#2563eb" fillOpacity={0.78} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScatterPlot;
