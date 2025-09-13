// components/TimeSelector.jsx
import React from 'react';

const TimeSelector = ({ label, timeOptions, selectedTime, setSelectedTime }) => (
  <label>
    {label}:&nbsp;
    <select
      value={selectedTime}
      onChange={e => setSelectedTime(e.target.value)}
    >
      {(timeOptions || []).map((time, i) => (
        <option key={i} value={time}>{time}</option>
      ))}
    </select>
  </label>
);

export default TimeSelector;
