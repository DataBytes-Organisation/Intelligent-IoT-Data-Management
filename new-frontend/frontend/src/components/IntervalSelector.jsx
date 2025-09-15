// components/IntervalSelector.jsx
import React from "react";
import { ClockIcon } from "lucide-react";

const IntervalSelector = ({
  intervals,
  selectedInterval,
  setSelectedInterval,
}) => (
  <div className="bg-white rounded-lg shadow-md p-5 h-full flex flex-col">
    <div className="flex items-center mb-4 text-blue-700">
      <ClockIcon className="h-5 w-5 mr-2" />
      <h3 className="text-lg font-medium">Select Interval</h3>
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-600 mb-3 text-left">
        time-window for rolling correlation
      </p>
      <div className="space-y-2">
        {intervals.map((interval, i) => (
          <label
            key={i}
            className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="radio"
              name="interval"
              value={interval}
              checked={selectedInterval === interval}
              onChange={(e) => setSelectedInterval(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 bg-white"
            />
            <span className="text-sm text-gray-700">{interval}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
);

export default IntervalSelector;
