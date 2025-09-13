import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const multiStreamData = [
  { timestamp: '2025-07-01', stream1: 24, stream2: 35, stream3: 45 },
  { timestamp: '2025-07-02', stream1: 28, stream2: 30, stream3: 40 },
  { timestamp: '2025-07-03', stream1: 32, stream2: 33, stream3: 42 },
  { timestamp: '2025-07-04', stream1: 31, stream2: 36, stream3: 39 }
];



const LineChartComponent = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="stream1" stroke="#8884d8" />
          <Line type="monotone" dataKey="stream2" stroke="#82ca9d" />
          <Line type="monotone" dataKey="stream3" stroke="#ff7300" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;
