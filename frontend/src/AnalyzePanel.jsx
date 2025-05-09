import React, { useState } from 'react';
import axios from 'axios';
import RealTimeGraph from './RealTimeGraph';
import './AnalyzePanel.css';

const AnalyzePanel = () => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [expectedCorrelation, setExpectedCorrelation] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const availableStreams = ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5'];

  const handleStreamChange = (stream) => {
    setSelectedStreams((prev) =>
      prev.includes(stream) ? prev.filter((s) => s !== stream) : [...prev, stream]
    );
  };

  const handleAnalyze = async () => {
    if (selectedStreams.length < 3 || !startTime || !endTime || !expectedCorrelation) {
      setError('Please select 3 streams and fill all fields.');
      return;
    }

    setError('');

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
      setError('Analysis failed. Check backend or network.');
    }
  };

  return (
    <div className="analyze-container">
      <h2>📊 Analyze Sensor Correlation</h2>

      <div className="form-group">
        <label>Select 3 Streams:</label>
        <div className="checkbox-group">
          {availableStreams.map((stream) => (
            <label key={stream} className="checkbox-label">
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

      <div className="form-group">
        <label>Start Time:</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>End Time:</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>Expected Correlation (0.0 - 1.0):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={expectedCorrelation}
          onChange={(e) => setExpectedCorrelation(e.target.value)}
          className="input-field"
        />
      </div>

      <button onClick={handleAnalyze} className="analyze-btn">
        🔍 Analyze
      </button>

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className="result-section">
          <strong>Result:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="graph-section">
        <div className="graph-header">
          <h3>📈 Real-Time Data Graph</h3>
          <span className="live-badge">🟢 Live Stream</span>
        </div>
        <RealTimeGraph selectedStreams={selectedStreams} />
      </div>
    </div>
  );
};

export default AnalyzePanel;
