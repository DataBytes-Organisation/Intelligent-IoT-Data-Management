import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// import { getTrendline } from "../utils/trendlineUtils.js";

const ScatterPlot = ({ data, streams, title }) => {
  if (!data || data.length === 0 || streams.length < 2) {
    return null;
  }

  const xStream = streams[0];
  const yStream = streams[1];

  const scatterData = data
    .map((d) => ({
      x: parseFloat(d[xStream]),
      y: parseFloat(d[yStream]),
    }))
    .filter((d) => !isNaN(d.x) && !isNaN(d.y));

  // const trendlineData = getTrendline(scatterData);

  if (scatterData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6 mt-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
        <p className="text-gray-500">No data available for scatter plot</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 mt-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              dataKey="x"
              name={xStream}
              label={{ value: xStream, position: "insideBottom", offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yStream}
              label={{ value: yStream, angle: -90, position: "insideLeft" }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Scatter name="Data Points" data={scatterData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScatterPlot;
