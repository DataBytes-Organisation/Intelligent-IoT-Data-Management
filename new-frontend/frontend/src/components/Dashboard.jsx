import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSensorData } from '../hooks/useSensorData.js';
import { useFilteredData } from '../hooks/useFilteredData.js';
import { useStreamNames } from '../hooks/useStreamNames.js';
import { useTimeRange } from '../hooks/useTimeRange.js';
import StreamSelector from './StreamSelector.jsx';
import IntervalSelector from './IntervalSelector.jsx';
import StreamStats from './StreamStats.jsx';
import './Dashboard.css';
import Chart from './Chart.jsx';
import CorrelationAnalysis from './CorrelationAnalysis.jsx';
import { calculateCorrelation } from '../utils/correlationUtils.js';
import TimeRangePanel from './TimeRangePanel.jsx';
import ActiveAlerts from "./ActiveAlerts.jsx";
import { runAnalysis } from '../services/analysisService.js';

const Dashboard = ({ datasetId }) => {
  // --- ALL HOOKS FIRST ---
  const { data: sensorData, loading, error, isEmpty, isValid } = useSensorData(datasetId);

  const data = useMemo(() => {
    if (!sensorData || !sensorData.rows) return [];
    const streamIds = sensorData.metadata?.streams?.map(s => s.id) || [];
    return sensorData.rows.map((row) => {
      const entry = {
        created_at: row.created_at,
        entry_id: row.entry_id,
      };
      streamIds.forEach((id) => {
        entry[id] = row[id] !== undefined ? row[id] : null;
      });
      return entry;
    });
  }, [sensorData]);

  const streamNames = useStreamNames(data);
  const { timeOptions } = useTimeRange(data);

  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [hasAnalysed, setHasAnalysed] = useState(false);

  useEffect(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setHasAnalysed(false);
  }, [datasetId, selectedStreams]);

  const intervals = ['5min', '15min', '1h', '6h'];
  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  const [showTimePanel, setShowTimePanel] = useState(false);
  const [timeMode, setTimeMode] = useState("absolute");
  const [relativeRange, setRelativeRange] = useState("5min");
  const [finalStartTime, setFinalStartTime] = useState(null);
  const [finalEndTime, setFinalEndTime] = useState(null);

  const filteredData = useFilteredData(data, {
    startTime: finalStartTime,
    endTime: finalEndTime,
    selectedStreams,
    interval: selectedInterval
  });

  const streamCount = selectedStreams.length;

  const correlationSummary = useMemo(() => {
    if (selectedStreams.length !== 2 || filteredData.length === 0) return null;

    const [streamA, streamB] = selectedStreams;

    const x = filteredData
      .map((d) => parseFloat(d[streamA]))
      .filter((v) => !isNaN(v));

    const y = filteredData
      .map((d) => parseFloat(d[streamB]))
      .filter((v) => !isNaN(v));

    if (x.length === 0 || y.length === 0 || x.length !== y.length) return null;

    const correlation = calculateCorrelation(x, y);

    if (Number.isNaN(correlation) || !Number.isFinite(correlation)) return null;

    let strengthLabel = 'Weak relationship';

    if (correlation >= 0.7) strengthLabel = 'Strong positive relationship';
    else if (correlation >= 0.3) strengthLabel = 'Moderate positive relationship';
    else if (correlation <= -0.7) strengthLabel = 'Strong negative relationship';
    else if (correlation <= -0.3) strengthLabel = 'Moderate negative relationship';

    return {
      streams: `${streamA} vs ${streamB}`,
      value: correlation.toFixed(2),
      label: strengthLabel,
    };
  }, [selectedStreams, filteredData]);

  const handleSubmit = useCallback(() => {
    console.log("Dashboard timeMode:", timeMode, "relativeRange:", relativeRange);

    if (timeMode === "absolute") {
      setFinalStartTime(
        selectedTimeStart ? new Date(selectedTimeStart).getTime() : null
      );
      setFinalEndTime(
        selectedTimeEnd ? new Date(selectedTimeEnd).getTime() : null
      );
    }

    if (timeMode === "relative") {
      const now = new Date(data[data.length - 1].created_at).getTime();
      const ranges = {
        "5min": 5 * 60 * 1000,
        "15min": 15 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000
      };
      const duration = ranges[relativeRange] || 0;
      setFinalEndTime(now);
      setFinalStartTime(now - duration);
    }

    setShowTimePanel(false);
  }, [timeMode, relativeRange, selectedTimeStart, selectedTimeEnd, data]);

  const handleRefresh = useCallback(() => {
    if (timeMode === "relative") {
      const now = new Date(data[data.length - 1].created_at).getTime();
      const ranges = {
        "5min": 5 * 60 * 1000,
        "15min": 15 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000
      };
      const duration = ranges[relativeRange];
      setFinalEndTime(now);
      setFinalStartTime(now - duration);
      console.log("Refreshed relative time range");
      return;
    }
    setFinalStartTime(finalStartTime);
    setFinalEndTime(finalEndTime);
    console.log("Refreshed absolute time range");
  }, [timeMode, relativeRange, data, finalStartTime, finalEndTime]);

  const handleRunAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setHasAnalysed(false);

    try {
      const result = await runAnalysis({
        datasetId,
        selectedStreams,
      });

      setAnalysisResult(result);
      setHasAnalysed(true);
    } catch (err) {
      setAnalysisResult(null);
      setAnalysisError(err);
      setHasAnalysed(true);
    } finally {
      setAnalysisLoading(false);
    }
  }, [datasetId, selectedStreams]);

  const formatTimeRange = (start, end, mode, range) => {
    if (mode === "relative") {
      return `Last ${range}`;
    }
    const startStr = new Date(start).toLocaleString();
    const endStr = new Date(end).toLocaleString();
    return `${startStr} → ${endStr}`;
  };

  // --- CONDITIONAL RETURNS (after all hooks) ---
  if (loading) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner" style={{
          border: "4px solid #e2e8f0",
          borderTop: "4px solid #2563eb",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1rem",
        }} />
        <p>Loading sensor data for {datasetId}...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem", color: "#dc2626" }}>
        <p>⚠️ {error.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.5rem",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem", color: "#dc2626" }}>
        <p>⚠️ The data format is invalid and cannot be displayed.</p>
      </div>
    );
  }

  if (isEmpty || !sensorData || !sensorData.rows || sensorData.rows.length === 0) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <p>📭 No sensor records found for this dataset.</p>
      </div>
    );
  }

  // --- REST OF THE COMPONENT (unchanged) ---
  return (
    <div className="dashboard-page">
      <section className="dashboard-section info-panel">
        <h3 className="section-title">Dashboard Notes</h3>
        <ol className="note-list">
          <li>Select at least one stream to view the line chart.</li>
          <li>
            Select two streams to view their scatter plot, correlation coefficient,
            and rolling correlation using the selected time window.
          </li>
          <li>
            Select at least three streams to identify the most correlated pair in
            the selected time range.
          </li>
          <li>
            If no scatter plot is shown, the selected data may not have enough
            variance.
          </li>
          <li>
            If no rolling correlation line is shown, the selected data may not have
            enough variance.
          </li>
          <li>
            If no meaningful scatter plot is available for the most correlated pair,
            one or both streams may lack variance.
          </li>
          <li>If no time range is selected, the entire dataset is used.</li>
        </ol>

        <div className="dataset-summary">
          <div className="summary-pill">
            <span>Total Data Points</span>
            <strong>{data.length}</strong>
          </div>
          <div className="summary-pill">
            <span>Selected Range Points</span>
            <strong>{filteredData.length}</strong>
          </div>
        </div>
      </section>
      <section className="dashboard-section stream-panel">
  <h3 className="section-title">Available Streams</h3>
  <div className="streams-container">
    {streamNames.map((stream, index) => (
     <div key={index} className="stream-chip">
       <span className="stream-name">{stream.name}</span>
       {stream.unit && <span className="stream-unit">({stream.unit})</span>}
     </div>
    ))}
  </div>
      </section>

      <section className="dashboard-section controls-panel">
        <h3 className="section-title">Controls</h3>

        <div className="selector-grid">
          <div className="selector-group">
            <StreamSelector
              streams={streamNames.map(s => s.name)}
              selectedStreams={selectedStreams}
              setSelectedStreams={setSelectedStreams}
            />
          </div>
          <div className="selector-group">
            <IntervalSelector
              intervals={intervals}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />
          </div>

          <div className="time-controls-wrapper">
            <div className='time-controls'>
              <button
                className="time-range-toggle"
                onClick={() => setShowTimePanel(prev => !prev)}>
                {finalStartTime && finalEndTime
                  ? formatTimeRange(finalStartTime, finalEndTime, timeMode, relativeRange)
                  : "Select Time Range ▼"}
              </button>

              <button className="refresh-btn" onClick={handleRefresh}>
                ⟳
              </button>
            </div>
          </div>
          {showTimePanel && (
            <div className="time-range-overlay">
              <TimeRangePanel
                timeOptions={timeOptions}
                selectedTimeStart={selectedTimeStart}
                setSelectedTimeStart={setSelectedTimeStart}
                selectedTimeEnd={selectedTimeEnd}
                setSelectedTimeEnd={setSelectedTimeEnd}
                timeMode={timeMode}
                setTimeMode={setTimeMode}
                relativeRange={relativeRange}
                setRelativeRange={setRelativeRange}
                onAnalyze={handleSubmit}
              />
            </div>
          )}
          
          <button
            className="run-analysis-btn"
            onClick={handleRunAnalysis}
            disabled={analysisLoading || selectedStreams.length < 2}
          >
            {analysisLoading ? 'Running Analysis...' : 'Run Analysis'}
          </button>
        </div>
      </section>

      <section className="dashboard-section insights-panel">
        <h3 className="section-title">Insight Cards</h3>

        {streamCount === 0 ? (
          <div className="empty-state">
            Please select one or more streams to view summary insights and charts.
          </div>
        ) : (
          <div className="stream-stats">
           {selectedStreams.map((stream) => (
             <StreamStats
               key={stream}
               data={filteredData}
               stream={stream}
            />
            ))}
          </div>
        )}
      </section>

      {/* Block 23 - Active Alerts Dashboard Integration*/}
      <ActiveAlerts
        alerts={analysisResult?.alerts ?? []}
        loading={analysisLoading}
        error={analysisError}
        hasAnalysed={hasAnalysed}  
      />
      <section className="dashboard-section analysis-panel">
        <h3 className="section-title">Analysis Summary</h3>

        {!hasAnalysed && !analysisLoading && (
          <div className="status-message">
            Run an analysis to view the summary.
          </div>
        )}

        {analysisLoading && (
          <div className="status-message">
            Running analysis...
          </div>
        )}

        {hasAnalysed && !analysisLoading && analysisResult?.summary && (
          <div className="status-message">
            Processed items: {analysisResult.summary.processed_items}
            {' | '}
            Alerts detected: {analysisResult.summary.alert_count}
          </div>
        )}
      </section>
      <div className="chart-analysis-grid">
        <section className="dashboard-section chart-analysis-card">
          <h3 className="section-title chart-section-title">
            Sensor Trends <span>(Selected Streams)</span>
          </h3>
          <Chart data={filteredData} selectedStreams={selectedStreams} />
        </section>

        <section className="dashboard-section chart-analysis-card correlation-analysis-card">
          <h3 className="section-title chart-section-title">Correlation Analysis</h3>
          <CorrelationAnalysis data={filteredData} selectedStreams={selectedStreams} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
