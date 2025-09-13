// components/IntervalSelector.jsx
import React from 'react';

const IntervalSelector = ({ intervals, selectedInterval, setSelectedInterval }) => (
  
  <label>
    <h3>Select Interval</h3>
    <p>time-window for rolling correlation</p>
    <select
      value={selectedInterval}
      onChange={e => setSelectedInterval(e.target.value)}
    >
      {intervals.map((interval, i) => (
        <option key={i} value={interval}>{interval}</option>
      ))}
    </select>
  </label>
);

export default IntervalSelector;
