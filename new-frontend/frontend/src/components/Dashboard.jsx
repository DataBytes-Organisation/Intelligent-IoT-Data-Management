import React, { useMemo, useState } from 'react';
import { useSensorData } from '../hooks/useSensorData.js';
import { useFilteredData } from '../hooks/useFilteredData.js';
import { useStreamNames } from '../hooks/useStreamNames.js';
import { useTimeRange } from '../hooks/useTimeRange.js';
import TimeSelector from './TimeSelector.jsx';
import StreamSelector from './StreamSelector.jsx';
import IntervalSelector from './IntervalSelector.jsx';
import StreamStats from './StreamStats.jsx';
import './Dashboard.css';
import Chart from './Chart.jsx';
import MostCorrelatedPair from './MostCorrelatedPair.jsx';
import ScatterPlot from './ScatterPlot.jsx';
import { calculateCorrelation } from '../utils/correlationUtils.js';
import TimeRangePanel from './TimeRangePanel.jsx';

const Dashboard = ({ datasetName }) => {
  const { data, loading, error } = useSensorData(
  false,
  `/api/datasets/${encodeURIComponent(datasetName)}/series`
);
  const streamNames = useStreamNames(data);
  const { timeOptions, minTime, maxTime } = useTimeRange(data);

  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);

  const intervals = ['5min', '15min', '1h', '6h'];
  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  // Time range panel state
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [timeMode, setTimeMode] = useState("absolute"); // "absolute" or "relative"
  const [relativeRange, setRelativeRange] = useState("5min");
  const [finalStartTime, setFinalStartTime] = useState(null);
  const [finalEndTime, setFinalEndTime] = useState(null);
  // End of time range panel state

  // const filteredData = useFilteredData(data, {
  //   startTime: selectedTimeStart,
  //   endTime: selectedTimeEnd,
  //   selectedStreams,
  //   interval: selectedInterval,
  // });

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

  // const handleSubmit = () => {
  //   console.log('Selected Time Range:', selectedTimeStart, '→', selectedTimeEnd);
  //   console.log('selectedInterval:', selectedInterval);
  //   console.log('Filtered Data:', filteredData);
  // };

  // Time range selection logic:
  const handleSubmit = React.useCallback(() => {
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
      // const now = Date.now();
      const now = new Date(data[data.length - 1].created_at).getTime();


      const ranges = {
        "5min": 5 * 60 * 1000,
        "15min": 15 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 1000,
        "24h": 24 * 60 * 1000
      };

      const duration = ranges[relativeRange] || 0;

      setFinalEndTime(now);
      setFinalStartTime(now - duration);
    }

    setShowTimePanel(false);
  }, [timeMode, relativeRange, selectedTimeStart, selectedTimeEnd]);
  // End of time range selection logic

  // Refresh button logic: re-apply the current time range selection
  const handleRefresh = () => {
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

    // Absolute mode
    setFinalStartTime(finalStartTime);
    setFinalEndTime(finalEndTime);
    console.log("Refreshed absolute time range");
  };
  // End of refresh button logic

  // formatTimeRange function to display the selected time range in a user-friendly format
  const formatTimeRange = (start, end, mode, relativeRange) => {
    if (mode === "relative") {
      return `Last ${relativeRange}`;
    }

    // Absolute mode
    const startStr = new Date(start).toLocaleString();
    const endStr = new Date(end).toLocaleString();
    return `${startStr} → ${endStr}`;
  };



  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

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
        <p className="stream-list">{streamNames.map((s) => s.name).join(', ')}</p>
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
            {/* end streamdropdown */}
          </div>
          <div className="selector-group">
            <IntervalSelector
              intervals={intervals}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />

          </div>

          {/* <div className="selector-card selector-card-wide"> */}
          {/* <h4 className="subsection-title">Time Range Selection</h4> */}

          <div className="time-controls-wrapper">
            <div className='time-controls'>

              <button
                className="time-range-toggle"
                onClick={() => setShowTimePanel(prev => !prev)}>
                {/* Select Time Range ▼ */}
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
        </div>
      </section>

      <section className="dashboard-section insights-panel">
        <h3 className="section-title">Insight Cards</h3>

        {streamCount === 0 && (
          <div className="empty-state">
            Please select one or more streams to view summary insights and charts.
          </div>
        )}

        {streamCount > 0 && (
          <div className="stream-stats">
            {selectedStreams.map((stream) => (
              <StreamStats key={stream} data={filteredData} stream={stream} />
            ))}

            {correlationSummary && (
              <div className="insight-card correlation-card">
                <div className="insight-card-header">
                  <span className="insight-label">Correlation</span>
                  <h3 className="insight-stream-name">{correlationSummary.streams}</h3>
                </div>

                <div className="correlation-value">{correlationSummary.value}</div>
                <p className="correlation-text">{correlationSummary.label}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="dashboard-section analysis-panel">
        <h3 className="section-title">Analysis Summary</h3>

        {streamCount === 1 && (
          <div className="status-message">
            One stream selected. Add another stream to view correlation analysis.
          </div>
        )}

        {streamCount === 2 && (
          <div className="pair-stream-block">
            <div className="status-message">
              Two streams selected. Scatter plot and rolling correlation analysis are
              now available.
            </div>

            <ScatterPlot
              data={filteredData}
              streams={selectedStreams}
              title="Scatter Plot of Selected Streams"
            />
          </div>
        )}

        {streamCount > 2 && (
          <div className="multi-stream-block">
            <div className="status-message">
              {streamCount} streams selected. Showing the most correlated pair from
              the chosen streams.
            </div>

            <MostCorrelatedPair data={filteredData} streams={selectedStreams} />
          </div>
        )}
      </section>

      <section className="dashboard-section chart-panel">
        <h3 className="section-title">Chart View</h3>
        <div className="chart-container">
          <Chart data={filteredData} selectedStreams={selectedStreams} />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;