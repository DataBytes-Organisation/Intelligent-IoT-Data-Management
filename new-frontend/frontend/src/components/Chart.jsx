import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
// multiple charts with different colours
const colors = [
  "#8884d8",
  "#82ca9d",
  "#ff7300",
  "#ff0000",
  "#00c49f",
  "#0088fe",
];

const Chart = ({ data, selectedStreams }) => {
  if (!data || data.length === 0 || selectedStreams.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-8">
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center text-gray-400">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">Chart will appear here</p>
            <p className="text-sm">Select streams to view data visualization</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Data Visualization
      </h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="created_at"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend />
            {selectedStreams.map((stream, i) => (
              <Line
                key={stream}
                type="monotone"
                dataKey={stream}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
                name={stream}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
