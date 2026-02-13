// components/IntervalSelector.jsx
import React from "react";

const IntervalSelector = ({
  intervals,
  selectedInterval,
  setSelectedInterval,
}) => (
  <div>
    <h3 className="text-gray-800 font-semibold mb-2">Select Interval</h3>
    <p className="text-gray-600 text-sm mb-4">
      time-window for rolling correlation
    </p>
    <div className="space-y-3">
      {intervals.map((interval) => (
        <label
          key={interval}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <input
            type="radio"
            name="interval"
            value={interval}
            checked={selectedInterval === interval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-gray-700">{interval}</span>
        </label>
      ))}
    </div>
  </div>
);

export default IntervalSelector;
