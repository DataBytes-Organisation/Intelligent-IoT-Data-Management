import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';

import MostCorrelatedPair from './MostCorrelatedPair.jsx';

import { getTrendline } from '../utils/trendlineUtils.js';


const ScatterPlot = ({ data, streams, title }) => {

  const xStream = streams[0];
  const yStream = streams[1];

  const scatterData = data.map(d => ({
    x: parseFloat(d[xStream]),
    y: parseFloat(d[yStream]),
  }));

  const trendlineData = getTrendline(scatterData);

  return (
    <div className="scatter-card">
      <h4>{title}</h4>
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
      >
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="x"
          name={xStream}
          label={{ value: xStream, position: 'bottom' }}
        //   tickFormatter={(value) => value.toFixed(2)}  // shows 2 decimal places
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yStream}
          label={{ value: yStream, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Correlation" data={scatterData} fill="#8884d8" />
        <Line
          type="linear"
          data={trendlineData}
          dataKey="y"
          stroke="#ff7300"
          dot={false}
        />
      </ScatterChart>
    </ResponsiveContainer>
    </div>
  );
};



export default ScatterPlot;
