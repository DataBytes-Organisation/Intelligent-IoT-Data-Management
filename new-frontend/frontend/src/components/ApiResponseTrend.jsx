import React from 'react';

const ApiResponseTrend = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No recent server response data available yet.</p>;
  }

  const width = 700;
  const height = 300;
  const padding = 60;
  const pointColors = [
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#dc2626',
  '#7c3aed',
  '#0f766e',
  '#f59e0b',
  '#db2777',
];

  const values = data.map((item) => item.responseTime);

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const averageValue =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  const variation = maxValue - minValue;
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x =
      padding +
      (index * (width - padding * 2)) /
        Math.max(data.length - 1, 1);

    const y =
      height -
      padding -
      ((item.responseTime - minValue) / range) *
        (height - padding * 2);

    return { x, y, ...item };
  });

  let performanceMessage = 'Server response is stable';

  if (variation > 80) {
    performanceMessage = 'Server response is changing noticeably';
  } else if (variation > 40) {
    performanceMessage = 'Server response has some variation';
  }

  return (
    <div className="api-metrics-layout">

      <div className="api-chart-area">
        <h3>Server Response Speed</h3>

        <p className="api-chart-description">
          Shows how quickly the system responded to recent requests.
          Lower response times mean faster responses.
        </p>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="api-response-chart"
        >
          <defs>
  <linearGradient id="responseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stopColor="#2563eb" />
    <stop offset="35%" stopColor="#9333ea" />
    <stop offset="70%" stopColor="#ea580c" />
    <stop offset="100%" stopColor="#16a34a" />
  </linearGradient>
</defs>
          {/* horizontal guide lines */}
          {[0.25, 0.5, 0.75].map((position) => {
            const y =
              padding +
              (height - padding * 2) * position;

            return (
              <line
                key={position}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#dbeafe"
                strokeDasharray="5 5"
              />
            );
          })}

          {/* Y axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#64748b"
          />

          {/* X axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#64748b"
          />

          {/* Y axis label */}
          <text
            x="18"
            y={height / 2}
            transform={`rotate(-90 18 ${height / 2})`}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#334155"
          >
            Response Speed (milliseconds)
          </text>

          {/* X axis label */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#334155"
          >
            Recent Server Requests
          </text>

          {/* colourful trend line */}
          <polyline
            fill="none"
            stroke="url(#responseGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          />

          {/* data points */}
          {points.map((point, index) => (
            <g key={index}>

              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={pointColors[index % pointColors.length]}
                stroke="#ffffff"
                strokeWidth="2"
              />

              <text
                x={point.x}
                y={point.y - 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#1e293b"
              >
                {point.responseTime} ms
              </text>

              <text
                x={point.x}
                y={height - padding + 22}
                textAnchor="middle"
                fontSize="11"
                fill="#475569"
              >
                {`Request ${index + 1}`}
              </text>

            </g>
          ))}
        </svg>
      </div>

      <div className="api-insights-panel">
        <h3>Server Performance Summary</h3>

        <div className="api-insight-item">
          <span>Typical response speed</span>
          <strong>{averageValue.toFixed(2)} ms</strong>
        </div>

        <div className="api-insight-item">
          <span>Fastest response</span>
          <strong>{minValue.toFixed(2)} ms</strong>
        </div>

        <div className="api-insight-item">
          <span>Slowest response</span>
          <strong>{maxValue.toFixed(2)} ms</strong>
        </div>

        <div className="api-insight-item">
          <span>Response variation</span>
          <strong>{variation.toFixed(2)} ms</strong>
        </div>

        <div className="api-performance-message">
          <strong>Current behaviour</strong>
          <p>{performanceMessage}</p>
        </div>
      </div>

    </div>
  );
};

export default ApiResponseTrend;