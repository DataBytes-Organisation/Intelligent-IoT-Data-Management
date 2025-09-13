import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// const data = [
//   { timestamp: '2025-07-01', value: 23 },
//   { timestamp: '2025-07-02', value: 28 },
//   { timestamp: '2025-07-03', value: 31 },
//   { timestamp: '2025-07-04', value: 27 }
// ];


const SingleLineChart = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SingleLineChart;
