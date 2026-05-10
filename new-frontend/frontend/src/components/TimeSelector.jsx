// components/TimeSelector.jsx
import React from 'react';

const TimeSelector = ({ label, timeOptions, selectedTime, setSelectedTime, placeholder = 'Any time' }) => (
  <label>
    {label}:&nbsp;
    <select
      value={selectedTime}
      onChange={e => setSelectedTime(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {(timeOptions || []).map((time, i) => (
        <option key={i} value={time}>{time}</option>
      ))}
    </select>
  </label>
);

export default TimeSelector;
