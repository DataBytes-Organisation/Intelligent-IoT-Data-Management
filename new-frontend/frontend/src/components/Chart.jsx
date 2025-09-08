import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const colors = ['#8884d8', '#82ca9d', '#ff7300', '#ff0000', '#00c49f', '#0088fe'];

// dot renderer that colors by per-point quality flag if present
const makeCustomDot = (dataKey) => (props) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const flag = payload[`${dataKey}_quality`];
  const fill = flag === false ? '#ff0000' : '#00a35a'; // red for anomaly, green otherwise
  return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />;
};

export default function Chart({ data, selectedStreams }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const showDots = true;

  return (
    <LineChart width={900} height={380} data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"               // numeric ms since epoch (from merge)
        type="number"
        domain={['dataMin', 'dataMax']}
        tickFormatter={(v) => new Date(v).toLocaleString()}
        scale="time"
      />
      <YAxis />
      <Tooltip
        labelFormatter={(v) => new Date(v).toLocaleString()}
        formatter={(value, name, props) => {
          const q = props?.payload?.[`${name}_quality`];
          return [value, q === false ? `${name} (anomaly)` : `${name} (normal)`];
        }}
      />
      <Legend />
      {selectedStreams.map((stream, i) => (
        <Line
          key={stream}
          type="monotone"
          dataKey={stream}
          stroke={colors[i % colors.length]}
          dot={showDots ? makeCustomDot(stream) : false}
          isAnimationActive={false}
        />
      ))}
    </LineChart>
  );
}
