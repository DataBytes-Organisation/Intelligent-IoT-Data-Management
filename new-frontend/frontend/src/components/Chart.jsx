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
  console.log("Chart data:", data);
  console.log("Selected streams:", selectedStreams);

  // Check if we have data and selected streams
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No data available</div>
    );
  }

  if (!selectedStreams || selectedStreams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select streams to display
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 32, right: 24, bottom: 48, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <Legend
            verticalAlign="top"
            align="center"
            wrapperStyle={{ paddingBottom: 8 }}
          />
          <XAxis
            dataKey="created_at"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {selectedStreams.map((stream, i) => (
            <Line
              key={stream}
              type="monotone"
              dataKey={stream}
              stroke={colors[i % colors.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
