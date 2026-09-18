import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getChartColor } from "../utils/chartColors.js";

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValue = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return number.toFixed(2);
};

const AnalyticsMiniChart = ({
  data,
  stream,
  displayName,
  colorIndex,
  onClick,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="insight-mini-chart-empty">
        No data available for this time range.
      </div>
    );
  }

  return (
    <div
    className="insight-mini-chart insight-mini-chart--clickable"
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-label={`Focus ${displayName || stream} in the sensor timeline`}
    onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick?.();
        }
    }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 8,
            right: 8,
            bottom: 4,
            left: -12,
          }}
        >
          <CartesianGrid
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="created_at"
            tickFormatter={formatTimestamp}
            tick={{
              fill: "#64748b",
              fontSize: 10,
            }}
            minTickGap={28}
          />

          <YAxis
            tick={{
              fill: "#64748b",
              fontSize: 10,
            }}
            width={48}
          />

          <Tooltip
            labelFormatter={(label) => {
              const date = new Date(label);

              return Number.isNaN(date.getTime())
                ? label
                : date.toLocaleString();
            }}
            formatter={(value) => [
              formatValue(value),
              displayName || stream,
            ]}
            contentStyle={{
              borderRadius: 8,
              borderColor: "#dbeafe",
              fontSize: 11,
            }}
          />

            <Line
            type="linear"
            dataKey={stream}
            name={displayName || stream}
            stroke={getChartColor(colorIndex)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsMiniChart;