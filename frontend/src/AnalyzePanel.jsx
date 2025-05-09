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

  const [timeRange, setTimeRange] = useState('');
  const [sensorFilter, setSensorFilter] = useState('');
  const [valueThreshold, setValueThreshold] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

      <div className="action-row">
        <button onClick={handleAnalyze} className="analyze-btn">
          🔍 Analyze
        </button>
        <button onClick={() => setShowFilters(!showFilters)} className="analyze-btn">
          ⏳ Filter Data
        </button>
      </div>

      {showFilters && (
        <div className="filter-menu">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="">Time Range</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last Day</option>
          </select>

          <select
            value={sensorFilter}
            onChange={(e) => setSensorFilter(e.target.value)}
            className="input-field"
          >
            <option value="">Sensor Type</option>
            {availableStreams.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={valueThreshold}
            onChange={(e) => setValueThreshold(e.target.value)}
            className="input-field"
          >
            <option value="">Value Range</option>
            <option value="10">Above 10</option>
            <option value="20">Above 20</option>
            <option value="30">Above 30</option>
            <option value="40">Above 40</option>
            <option value="50">Above 50</option>
          </select>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div className="graph-section">
        <div className="graph-header">
          <h3>📈 Real-Time Data Graph</h3>
          <span className="live-badge">
            🟢 Live Stream {sensorFilter ? `for ${sensorFilter}` : ''}
          </span>
        </div>
        <RealTimeGraph
          selectedStreams={selectedStreams}
          timeRange={timeRange}
          sensorFilter={sensorFilter}
          valueThreshold={valueThreshold}
        />
      </div>
    </div>
  );
};

export default AnalyzePanel;
