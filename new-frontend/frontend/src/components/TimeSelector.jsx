// components/TimeSelector.jsx
import React from "react";
import { CalendarIcon } from "lucide-react";

const TimeSelector = ({
  label,
  timeOptions,
  selectedTime,
  setSelectedTime,
}) => (
  <div>
    <div className="flex items-center mb-3 text-blue-700">
      <h3 className="text-lg font-medium">{label}</h3>
    </div>
    <div>
      <select
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
        value={selectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
      >
        <option value="">Select {label}</option>
        {(timeOptions || []).map((time, i) => (
          <option key={i} value={time}>
            {time}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default TimeSelector;
