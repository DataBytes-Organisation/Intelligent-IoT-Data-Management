// components/IntervalSelector.jsx
import React from "react";
import "./IntervalSelector.css";

/**
 * IntervalSelector (Chip Dropdown + SVG Icon + Tooltip)
 * -----------------------------------------------------
 * - Compact chip-style dropdown
 * - Clean SVG clock icon
 * - Less rounded edges for a modern dashboard look
 * - Tooltip explains "rolling window interval"
 */
const IntervalSelector = ({ intervals, selectedInterval, setSelectedInterval }) => {
  return (
    <div className="interval-chip-container">

      {/* Icon with tooltip */}
      <div className="interval-icon-wrapper" title="Rolling window interval">
        <svg
          className="interval-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="11"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>

      {/* Chip-style dropdown */}
      <select
        className="interval-chip-select"
        value={selectedInterval}
        onChange={(e) => setSelectedInterval(e.target.value)}
        title="Rolling window interval"
      >
        {intervals.map((interval) => (
          <option key={interval} value={interval}>
            {interval}
          </option>
        ))}
      </select>

    </div>
  );
};

export default IntervalSelector;
