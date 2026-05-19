// components/TimeSelector.jsx
import React from "react";
import { ChevronDown } from "lucide-react";
const TimeSelector = ({
  label,
  timeOptions,
  selectedTime,
  setSelectedTime,
}) => (
  <div>
    <label className="block text-gray-700 font-medium mb-2">{label}:</label>
    <div className="relative">
      <select
        value={selectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
      >
        <option value="">Select {label}</option>
        {(timeOptions || []).map((time, i) => (
          <option key={i} value={time}>
            {time}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  </div>
);

export default TimeSelector;
