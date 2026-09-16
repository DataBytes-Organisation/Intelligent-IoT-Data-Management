import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const colors = [
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#dc2626',
  '#7c3aed',
  '#0f766e',
];

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
};

const AnalyticsMiniChart = ({ data, stream, index, summary }) => {
  return (
    <div className="analytics-mini-card">
      <div className="analytics-mini-header">
        <h4>{stream}</h4>
        <span>{summary.records} records</span>
      </div>

      <div className="analytics-mini-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 4, left: -18 }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="created_at"
              tickFormatter={formatTimestamp}
              tick={{ fill: '#64748b', fontSize: 9 }}
              minTickGap={30}
            />

            <YAxis
              tick={{ fill: '#64748b', fontSize: 9 }}
              width={45}
            />

            <Tooltip
              labelFormatter={(label) =>
                new Date(label).toLocaleString()
              }
              contentStyle={{
                borderRadius: 8,
                borderColor: '#dbeafe',
                fontSize: 11,
              }}
            />

            <Line
              type="monotone"
              dataKey={stream}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="analytics-mini-stats">
        <span>Avg: {summary.average}</span>
        <span>Min: {summary.min}</span>
        <span>Max: {summary.max}</span>
      </div>
    </div>
  );
};

export default AnalyticsMiniChart;