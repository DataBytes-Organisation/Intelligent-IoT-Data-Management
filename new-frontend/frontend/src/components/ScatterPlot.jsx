import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line
} from 'recharts';

import { getTrendline } from '../utils/trendlineUtils.js';

const ScatterPlot = ({ data, streams, title, showSummary = true }) => {
  const xStream = streams[0];
  const yStream = streams[1];

  const scatterData = data
    .map((d) => ({
      x: parseFloat(d[xStream]),
      y: parseFloat(d[yStream]),
    }))
    .filter((point) => !isNaN(point.x) && !isNaN(point.y));

  const trendlineData = getTrendline(scatterData);

  let correlation = 0;

  if (scatterData.length > 1) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < scatterData.length; i++) {
      sumX += scatterData[i].x;
      sumY += scatterData[i].y;
      sumXY += scatterData[i].x * scatterData[i].y;
      sumX2 += scatterData[i].x * scatterData[i].x;
      sumY2 += scatterData[i].y * scatterData[i].y;
    }

    const n = scatterData.length;
    const top = n * sumXY - sumX * sumY;
    const bottom = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (bottom !== 0) {
      correlation = top / bottom;
    }
  }

  let interpretation = 'Little or no correlation';
  let interpretationClass = 'neutral';

  if (correlation >= 0.8) {
    interpretation = 'Strong positive correlation';
    interpretationClass = 'positive';
  } else if (correlation >= 0.5) {
    interpretation = 'Moderate positive correlation';
    interpretationClass = 'positive';
  } else if (correlation >= 0.3) {
    interpretation = 'Weak positive correlation';
    interpretationClass = 'positive';
  } else if (correlation <= -0.8) {
    interpretation = 'Strong negative correlation';
    interpretationClass = 'negative';
  } else if (correlation <= -0.5) {
    interpretation = 'Moderate negative correlation';
    interpretationClass = 'negative';
  } else if (correlation <= -0.3) {
    interpretation = 'Weak negative correlation';
    interpretationClass = 'negative';
  }

  let explanation = 'The two selected streams do not show a strong relationship.';
  if (correlation >= 0.3) {
    explanation = 'The two selected streams show a positive relationship, meaning they tend to move in the same direction.';
  } else if (correlation <= -0.3) {
    explanation = 'The two selected streams show a negative relationship, meaning one tends to decrease when the other increases.';
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p><strong>{xStream}:</strong> {payload[0].payload.x}</p>
          <p><strong>{yStream}:</strong> {payload[0].payload.y}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="scatter-plot-wrapper">
      <h3 className="scatter-title">{title}</h3>

      {showSummary && (
        <div className="correlation-summary-box">
          <p><strong>Selected Streams:</strong> {xStream} and {yStream}</p>

          <div className="correlation-value-box">
            <span className="correlation-label">Correlation Value</span>
            <span className="correlation-number">{correlation.toFixed(2)}</span>
          </div>

          <div className={`interpretation-box ${interpretationClass}`}>
            <strong>Interpretation:</strong> {interpretation}
          </div>

          <p className="correlation-explanation">{explanation}</p>
        </div>
      )}

      <div className="scatter-chart-card">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={xStream}
              label={{ value: xStream, position: 'bottom' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yStream}
              label={{ value: yStream, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Correlation" data={scatterData} fill="#5b7cff" />
            <Line
              type="linear"
              data={trendlineData}
              dataKey="y"
              stroke="#ff7a00"
              dot={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScatterPlot;