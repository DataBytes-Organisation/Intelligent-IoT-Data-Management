import React, { useState } from 'react';
import BasicLine from './BasicLine';

const streams = [
  { id: 1, name: 'Temperature' },
  { id: 2, name: 'Humidity' },
  { id: 3, name: 'Pressure' },
];

const timeWindows = [
  { id: '1h', label: 'Last 1 hour' },
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
];

function SensorStreams() {
  const [selectedStream, setSelectedStream] = useState(streams[0].id);
  const [selectedWindow, setSelectedWindow] = useState(timeWindows[0].id);

  // pass these as props to chart components to fetch/filter data
  return (
    <div>
      <h2>Dashboard Controls</h2>
      <div style={{ marginBottom: '1em' }}>
        <label>
          Select Stream:&nbsp;
          <select
            value={selectedStream}
            onChange={e => setSelectedStream(Number(e.target.value))}
          >
            {streams.map(stream => (
              <option key={stream.id} value={stream.id}>{stream.name}</option>
            ))}
          </select>
        </label>
        &nbsp;&nbsp;
        <label>
          Time Window:&nbsp;
          <select
            value={selectedWindow}
            onChange={e => setSelectedWindow(e.target.value)}
          >
            {timeWindows.map(win => (
              <option key={win.id} value={win.id}>{win.label}</option>
            ))}
          </select>
        </label>
      </div>
      {/* Pass selectedStream and selectedWindow as props if needed */}
      <BasicLine streamId={selectedStream} timeWindow={selectedWindow} />
      {/* Add more chart components as needed */}
    </div>
  );
}

export default SensorStreams;