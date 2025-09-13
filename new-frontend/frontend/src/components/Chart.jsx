import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid} from 'recharts';
// multiple charts with different colours
const colors = ['#8884d8', '#82ca9d', '#ff7300', '#ff0000', '#00c49f', '#0088fe'];

const Chart = ({ data, selectedStreams }) => (
  <LineChart width={800} height={400} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="created_at" />
    <YAxis />
    <Tooltip />
    <Legend />
    {selectedStreams.map((stream, i) => (
      <Line
        key={stream}
        type="monotone"
        dataKey={stream}
        stroke={colors[i % colors.length]}
        dot={false}
      />
    ))}
  </LineChart>
);

export default Chart;
