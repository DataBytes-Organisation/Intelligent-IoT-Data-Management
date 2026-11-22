import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSensorData } from '../hooks/useSensorData.js';
import { useFilteredData } from '../hooks/useFilteredData.js';
import { useStreamNames } from '../hooks/useStreamNames.js';
import { useTimeRange } from '../hooks/useTimeRange.js';
import StreamSelector, { STREAM_LABELS } from './StreamSelector.jsx';
import IntervalSelector from './IntervalSelector.jsx';
import StreamStats from './StreamStats.jsx';
import './Dashboard.css';
import Chart from './Chart.jsx';
import RelationshipChangesTimeline from './RelationshipChangesTimeline.jsx';
import TimeRangePanel from './TimeRangePanel.jsx';
import { runAnalysis } from '../services/analysisService.js';
import AnalysisSummary from './AnalysisSummary.jsx';
import { useApiResponseMonitor } from "../hooks/useApiResponseMonitor";

const Dashboard = ({ datasetId }) => {
  const navigate = useNavigate();
  // --- ALL HOOKS FIRST ---
  const { data: sensorData, loading, error, isEmpty, isValid } = useSensorData(datasetId);
  const { serverStatus } = useApiResponseMonitor(datasetId); // while somebody is just looking at the normal dashboard, the measurements are already accumulating

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
  
  // Keep Rimzim's new streamLabels feature
  const streamLabels = useMemo(() => {
    return Object.fromEntries(
      (sensorData?.metadata?.streams || []).map((stream) => [
        stream.id,
        stream.name && stream.name !== stream.id
          ? stream.name
          : STREAM_LABELS[stream.id] || stream.id,
      ])
    );
  }, [sensorData]);

  const { timeOptions } = useTimeRange(data);

  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [hasAnalysed, setHasAnalysed] = useState(false);

  // redirect from line individual line chart, to general timeline, and highlight it
  const [focusedStream, setFocusedStream] = useState(null);
  const sensorTimelineRef = useRef(null);

  const handleInsightChartClick = useCallback((stream) => {
  setFocusedStream(stream);

  sensorTimelineRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  useEffect(() => {
    if (
      focusedStream &&
      !selectedStreams.includes(focusedStream)
    ) {
      setFocusedStream(null);
    }
  }, [focusedStream, selectedStreams]);


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

  const visibleStartTime = filteredData.length > 0 ? new Date(filteredData[0].created_at).getTime(): null;
  const visibleEndTime = filteredData.length > 0 ? new Date(filteredData[filteredData.length - 1].created_at).getTime(): null;

  const streamCount = selectedStreams.length;

  const handleSubmit = useCallback(() => {
    console.log(
      "Dashboard timeMode:",
      timeMode,
      "relativeRange:",
      relativeRange
    );

    if (timeMode === "absolute") {
      setFinalStartTime(
        selectedTimeStart
          ? new Date(selectedTimeStart).getTime()
          : null
      );

      setFinalEndTime(
        selectedTimeEnd
          ? new Date(selectedTimeEnd).getTime()
          : null
      );
    }

    if (timeMode === "relative") {
      const now = new Date(
        data[data.length - 1].created_at
      ).getTime();

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
  }, [
    timeMode,
    relativeRange,
    selectedTimeStart,
    selectedTimeEnd,
    data
  ]);

  const handleRefresh = useCallback(() => {
  // Clear selected streams
  setSelectedStreams([]);

  // Reset interval
  setSelectedInterval(intervals[0]);

  // Clear time range selections
  setSelectedTimeStart('');
  setSelectedTimeEnd('');
  setFinalStartTime(null);
  setFinalEndTime(null);

  // Reset time range controls
  setTimeMode("absolute");
  setRelativeRange("5min");
  setShowTimePanel(false);

  // Clear analysis results
  setAnalysisResult(null);
  setAnalysisError(null);
  setHasAnalysed(false);
}, []);

  const handleRunAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setHasAnalysed(false);

    try {
      const result = await runAnalysis({
        datasetId,
        selectedStreams,
      });
      console.log('Analysis result:', result);
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

    const startDate = new Date(start);
    const endDate = new Date(end);

    /*
      If both dates are the same, show the compact Figma-style date.
      Example: August 24, 2025
    */
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    const startStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const endStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startStr} - ${endStr}`;
  };

  // --- CONDITIONAL RETURNS ---
  if (loading) {
    return (
      <div
        className="dashboard-state"
        style={{
          textAlign: "center",
          padding: "3rem"
        }}
      >
        <div
          className="spinner"
          style={{
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #2563eb",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem",
          }}
        />

        <p>Loading sensor data for {datasetId}...</p>

        <style>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }

            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="dashboard-state"
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "#dc2626"
        }}
      >
        <p>
          ⚠️ {error.message || "An unexpected error occurred."}
        </p>

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
      <div
        className="dashboard-state"
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "#dc2626"
        }}
      >
        <p>
          ⚠️ The data format is invalid and cannot be displayed.
        </p>
      </div>
    );
  }

  if (
    isEmpty ||
    !sensorData ||
    !sensorData.rows ||
    sensorData.rows.length === 0
  ) {
    return (
      <div
        className="dashboard-state"
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "#64748b"
        }}
      >
        <p>
          📭 No sensor records found for this dataset.
        </p>
      </div>
    );
  }

  // --- REST OF THE COMPONENT ---
  return (
    <div className="dashboard-page">

      {/* =====================================================
          DASHBOARD NOTES
          ===================================================== */}

      <section className="dashboard-section info-panel">
        <h3 className="section-title">
          Dashboard Notes
        </h3>

        <ol className="note-list">
          <li>
            Select one or more streams to view their sensor data and insight cards.
          </li>

          <li>
            Select at least two streams to enable Run Analysis and analyse unusual readings and relationship changes.
          </li>

          <li>
            Use the Time Interval selector to change the rolling window used for the selected data.

          </li>

          <li>
            Use Time Range to analyse a specific absolute period or a relative period such as the last 5 minutes, 15 minutes, 1 hour, 6 hours, or 24 hours.

          </li>

          <li>
            The Analysis Summary reports unusual sensor readings and changes in relationships between selected streams.

          </li>

          <li>
            When two or more streams are selected, the Sensor Timeline uses a normalised view to make their patterns easier to compare.

          </li>

          <li>
            Relationship Changes highlights periods when the relationship between selected sensor pairs changes within the selected time range.

          </li>
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

      


      {/* ✅ THIS IS THE FIXED SECTION THAT READS DIRECTLY FROM BACKEND ✅ */}
      <section className="dashboard-section stream-panel">
        <h3 className="section-title">Available Streams</h3>
        <div className="streams-container">
          {sensorData.metadata?.streams?.map((stream, index) => {
            // ✅ USE THE EXACT SAME streamLabels FALLBACK AS THE DROPDOWN ✅
            const displayName = streamLabels[stream.id] || stream.id;
            const isSelected = selectedStreams.includes(stream.id);

            const toggleStream = () => {
              setSelectedStreams((previous) =>
                previous.includes(stream.id)
                  ? previous.filter((id) => id !== stream.id)
                  : [...previous, stream.id],
              );
            };
    
            return (
              <div 
                key={index} 
                className={`stream-chip ${isSelected ? 'selected' : ''}`}
                onClick={toggleStream}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleStream();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
              >
                {isSelected && <span className="checkmark" aria-hidden="true">&#10003;</span>}
                <span className="stream-name">{displayName}</span>
                {stream.unit && <span className="stream-unit">({stream.unit})</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          CONTROL PANEL
          ===================================================== */}

      <section className="dashboard-section controls-panel">

        <h3 className="section-title">
          Stream Selector
        </h3>

        <div className="controls-row">

          {/* SELECT STREAMS */}
          <div className="control-item streams-control">

            <div className="control-label">
              Select Streams
            </div>

            <StreamSelector
              streams={streamNames.map(s => s.id)}
              streamLabels={streamLabels}
              selectedStreams={selectedStreams}
              setSelectedStreams={setSelectedStreams}
            />

          </div>

          {/* TIME INTERVAL */}
          <div className="control-item interval-control">

            <div className="control-label">
              Time Interval
            </div>

            <IntervalSelector
              intervals={intervals}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />

          </div>

          {/* TIME RANGE */}
          <div className="control-item range-control">

            <div className="control-label">
              Time Range
            </div>

            <div className="time-range-container">

              <button
                type="button"
                className="time-range-button"
                onClick={() => setShowTimePanel((prev) => !prev)}
              >
                <span className="calendar-icon">
                  ▣
                </span>

                <span className="time-range-text">
                  {finalStartTime && finalEndTime
                    ? formatTimeRange(
                        finalStartTime,
                        finalEndTime,
                        timeMode,
                        relativeRange
                      )
                    : "Select Time Range"}
                </span>

                <span className="range-arrow">
                  ▼
                </span>
              </button>

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

          </div>

          {/* REFRESH */}
          <div className="refresh-control">

            <button
              type="button"
              className="refresh-control-button"
              onClick={handleRefresh}
            >
              <span className="refresh-icon">
                ⟳
              </span>

              <span>
                Reset
              </span>
            </button>

          </div>

          {/* RUN ANALYSIS */}
          <div className="run-analysis-control">

            <button
              type="button"
              className="run-analysis-btn"
              onClick={handleRunAnalysis}
              disabled={
                analysisLoading ||
                selectedStreams.length < 2
              }
            >
              {analysisLoading
                ? "Running Analysis..."
                : "Run Analysis"}
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          INSIGHT CARDS
          ===================================================== */}

      <section className="dashboard-section insights-panel">
        <h3 className="section-title">
          Insight Cards
        </h3>

        {streamCount === 0 ? (
          <div className="empty-state">
            Please select one or more streams to view summary insights and charts.
          </div>
        ) : (
          <div className="stream-stats">
            {selectedStreams.map((stream, index) => (
              <StreamStats
                key={stream}
                data={filteredData}
                stream={stream}
                colorIndex={index}
                displayName={
                  streamLabels[stream] ||
                  STREAM_LABELS[stream] ||
                  stream
                }
                onChartClick={() => handleInsightChartClick(stream)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Analysis Summary */}

      <AnalysisSummary
        alerts={analysisResult?.alerts ?? []}
        loading={analysisLoading}
        error={analysisError}
        hasAnalysed={hasAnalysed}
        streamLabels={streamLabels}
        summary={analysisResult?.summary ?? null}
      />
      <div className="chart-analysis-grid">
        <section
          ref={sensorTimelineRef}
          className="dashboard-section chart-analysis-card sensor-timeline-card"
        >
          <div className="sensor-timeline-header">
            <h3 className="section-title chart-section-title">
              Sensor Timeline
              {selectedStreams.length >= 2 && (
                <span> (normalised view)</span>
              )}
            </h3>

            {focusedStream && (
              <button
                type="button"
                className="clear-highlight-btn"
                onClick={() => setFocusedStream(null)}
              >
                Clear {streamLabels[focusedStream] || focusedStream} highlight
              </button>
            )}
          </div>

          <p className="sensor-timeline-description">
            {selectedStreams.length >= 2
              ? 'All selected streams are normalised for easy comparison.'
              : 'Sensor readings over time.'}
          </p>

          <Chart
            data={filteredData}
            selectedStreams={selectedStreams}
            streamLabels={streamLabels}
            alerts={analysisResult?.alerts ?? []}
            highlightedStream={focusedStream}
          />
        </section>

      </div>
      <section className="dashboard-section">
        <RelationshipChangesTimeline 

        selectedStreams={selectedStreams}
        alerts={analysisResult?.alerts ?? []}
        streamLabels={streamLabels}
        startTime={visibleStartTime}
        endTime={visibleEndTime}
        />
      </section>

      
      <section className="developer-status-bar">
        <div className="developer-status-left">
          <span
            className={`server-status-dot ${
              serverStatus === "good"
                ? "status-good"
                : serverStatus === "down"
                  ? "status-down"
                  : "status-checking"
            }`}
          />

          <div className="developer-status-text">
            <span className="developer-status-label">
              System status
            </span>

            <span className="developer-status-value">
              {serverStatus === "good"
                ? "Operational"
                : serverStatus === "down"
                  ? "Unavailable"
                  : "Checking..."}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="developer-metrics-link"
          onClick={() =>
            navigate(`/developer-metrics/${datasetId}`)
          }
        >
          Developer metrics
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  );
};

export default Dashboard;