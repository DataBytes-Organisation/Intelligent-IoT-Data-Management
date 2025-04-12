import React, { useState } from 'react';
import axios from 'axios';
import RealTimeGraph from './RealTimeGraph';

const AnalyzePanel = () => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [expectedCorrelation, setExpectedCorrelation] = useState('');
  const [result, setResult] = useState(null);

  const availableStreams = ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5'];

  const handleStreamChange = (stream) => {
    setSelectedStreams((prev) =>
      prev.includes(stream) ? prev.filter((s) => s !== stream) : [...prev, stream]
    );
  };

  const handleAnalyze = async () => {
    if (selectedStreams.length < 3 || !startTime || !endTime || !expectedCorrelation) {
      alert('Please select 3 streams and fill all fields.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', {
        streams: selectedStreams,
        start: startTime,
        end: endTime,
        expectedCorrelation: parseFloat(expectedCorrelation),
      });
      setResult(response.data);
    } catch (err) {
      console.error('Error during analysis:', err);
      alert('Analysis failed. Check backend or network.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>📊 Analyze Sensor Correlation</h2>

      <div>
        <label>Select 3 Streams:</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          {availableStreams.map((stream) => (
            <label key={stream}>
              <input
                type="checkbox"
                checked={selectedStreams.includes(stream)}
                onChange={() => handleStreamChange(stream)}
              />
              {stream}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label>Start Time:</label>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>

      <div>
        <label>End Time:</label>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>

      <div>
        <label>Expected Correlation (0.0 - 1.0):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={expectedCorrelation}
          onChange={(e) => setExpectedCorrelation(e.target.value)}
        />
      </div>

      <button onClick={handleAnalyze} style={{ marginTop: '15px' }}>
        🔍 Analyze
      </button>

      {result && (
        <div style={{ marginTop: '20px', background: '#f0f0f0', padding: '10px' }}>
          <strong>Result:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* Real-Time Graph Integration */}
      <RealTimeGraph selectedStreams={selectedStreams} />
    </div>
  );
};

export default AnalyzePanel;




