import React, { useState, useMemo, useEffect } from "react";
import "./TrafficHeatmap.css";
import {
  loadSensorData,
  transformToTrafficData,
  transformStreamDataToHeatmap,
  getSensorStatistics,
} from "../utils/dataLoader";

const TrafficHeatmap = ({ streamData = null, selectedStreams = [] }) => {
  // State for controls
  const [metric, setMetric] = useState("Stream Data");
  const [timePeriod, setTimePeriod] = useState("Week");
  const [filterByDay, setFilterByDay] = useState("All Days");
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(50);

  // State for data loading
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load sensor data on component mount or when streamData changes
  useEffect(() => {
    if (streamData && streamData.length > 0) {
      // Use provided stream data
      setSensorData(streamData);
      setLoading(false);
      setError(null);
    } else {
      // Fallback to loading sensor data
      const loadData = async () => {
        try {
          setLoading(true);
          const data = await loadSensorData();
          setSensorData(data);
          setError(null);
        } catch (err) {
          setError(err.message);
          console.error("Failed to load sensor data:", err);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [streamData]);

  // Transform sensor data to heatmap data
  const heatmapData = useMemo(() => {
    if (!sensorData) {
      // Fallback to sample data while loading
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const hours = [
        "10am",
        "10pm",
        "11am",
        "11pm",
        "12am",
        "12pm",
        "1am",
        "1pm",
        "2am",
        "2pm",
        "3am",
        "3pm",
        "4am",
        "4pm",
        "5am",
        "5pm",
        "6am",
        "6pm",
        "7am",
        "7pm",
        "8am",
        "8pm",
        "9am",
        "9pm",
      ];

      const data = {};
      days.forEach((day) => {
        data[day] = {};
        hours.forEach((hour) => {
          data[day][hour] = Math.floor(Math.random() * 51);
        });
      });

      data["Sunday"]["10am"] = 16;
      data["Sunday"]["12pm"] = 25;
      data["Thursday"]["12pm"] = 50;
      data["Thursday"]["3am"] = 0;

      return data;
    }

    // Use stream data if available, otherwise use traffic data
    if (selectedStreams && selectedStreams.length > 0) {
      const streamHeatmapData = transformStreamDataToHeatmap(
        sensorData,
        selectedStreams
      );
      if (streamHeatmapData) {
        return streamHeatmapData;
      }
    }

    return transformToTrafficData(sensorData);
  }, [sensorData, selectedStreams]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const allValues = [];
    let peakValue = 0;
    let peakDay = "";
    let peakHour = "";

    Object.entries(heatmapData).forEach(([day, hours]) => {
      Object.entries(hours).forEach(([hour, value]) => {
        allValues.push(value);
        if (value > peakValue) {
          peakValue = value;
          peakDay = day;
          peakHour = hour;
        }
      });
    });

    const average =
      allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    const total = allValues.reduce((sum, val) => sum + val, 0);

    return {
      average: Math.round(average),
      total,
      peakDay,
      peakHour,
    };
  }, [heatmapData]);

  // Get color intensity based on value
  const getColorIntensity = (value) => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));

    // Create gradient from light blue to dark blue
    const red = Math.floor(50 + (205 - 50) * clampedValue);
    const green = Math.floor(100 + (150 - 100) * clampedValue);
    const blue = Math.floor(255 - (255 - 50) * clampedValue);

    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Get text color for contrast
  const getTextColor = (value) => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    return normalizedValue > 0.5 ? "white" : "black";
  };

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const hours = [
    "10am",
    "10pm",
    "11am",
    "11pm",
    "12am",
    "12pm",
    "1am",
    "1pm",
    "2am",
    "2pm",
    "3am",
    "3pm",
    "4am",
    "4pm",
    "5am",
    "5pm",
    "6am",
    "6pm",
    "7am",
    "7pm",
    "8am",
    "8pm",
    "9am",
    "9pm",
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="traffic-heatmap-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading sensor data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="traffic-heatmap-container">
        <div className="error-state">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <p>Using sample data for demonstration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="traffic-heatmap-container">
      {/* Summary Cards - Now at the top */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">
            <div className="card-icon">📊</div>
            <div className="card-title">Average Value</div>
          </div>
          <div className="card-value">{summaryStats.average}</div>
          <div className="card-label">per hour</div>
          <div className="card-progress">
            <div className="progress-label">Min: 0</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(summaryStats.average / 50) * 100}%` }}
              ></div>
            </div>
            <div className="progress-label">Max: 50</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <div className="card-icon">📈</div>
            <div className="card-title">Total Value</div>
          </div>
          <div className="card-value">{summaryStats.total}</div>
          <div className="card-label">all periods</div>
          <div className="card-distribution">
            <div className="distribution-label">Distribution</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <div className="card-icon">🌊</div>
            <div className="card-title">Peak Times</div>
          </div>
          <div className="card-value">{summaryStats.peakDay}</div>
          <div className="card-label">{summaryStats.peakHour}</div>
          <div className="card-activity">
            <div className="activity-label">Activity Pattern</div>
            <div className="activity-bars">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="activity-bar"
                  style={{ height: `${Math.random() * 100}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-controls">
        <h3>Heatmap Controls</h3>

        {sensorData && (
          <div className="data-source-info">
            <div className="data-source-label">Data Source:</div>
            <div className="data-source-value">
              {selectedStreams.length > 0
                ? "Selected Streams"
                : "IoT Sensor Data"}
            </div>
            <div className="data-source-details">
              {sensorData.length} records loaded
              {selectedStreams.length > 0 && (
                <div>Selected streams: {selectedStreams.join(", ")}</div>
              )}
            </div>
          </div>
        )}

        <div className="controls-grid">
          <div className="control-group">
            <label>
              Metric: <span className="selected-value">({metric})</span>
            </label>
            <select
              value={metric}
              onChange={(e) => {
                console.log("Metric changed to:", e.target.value);
                setMetric(e.target.value);
              }}
            >
              <option value="Stream Data">Stream Data</option>
              <option value="Average">Average</option>
              <option value="Sum">Sum</option>
              <option value="Max">Max</option>
            </select>
          </div>

          <div className="control-group">
            <label>
              Time Period:{" "}
              <span className="selected-value">({timePeriod})</span>
            </label>
            <select
              value={timePeriod}
              onChange={(e) => {
                console.log("Time Period changed to:", e.target.value);
                setTimePeriod(e.target.value);
              }}
            >
              <option value="Week">Week</option>
              <option value="Day">Day</option>
              <option value="Month">Month</option>
            </select>
          </div>

          <div className="control-group">
            <label>
              Filter by Day:{" "}
              <span className="selected-value">({filterByDay})</span>
            </label>
            <select
              value={filterByDay}
              onChange={(e) => {
                console.log("Filter by Day changed to:", e.target.value);
                setFilterByDay(e.target.value);
              }}
            >
              <option value="All Days">All Days</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
            </select>
          </div>

          <div className="control-group">
            <label>Min Value: {minValue}</label>
            <input
              type="range"
              min="0"
              max="50"
              value={minValue}
              onChange={(e) => setMinValue(parseInt(e.target.value))}
              className="slider"
            />
          </div>

          <div className="control-group">
            <label>Max Value: {maxValue}</label>
            <input
              type="range"
              min="0"
              max="50"
              value={maxValue}
              onChange={(e) => setMaxValue(parseInt(e.target.value))}
              className="slider"
            />
          </div>

          <div className="control-group">
            <button
              className="reset-button"
              onClick={() => {
                console.log("Resetting all filters");
                setMetric("Stream Data");
                setTimePeriod("Week");
                setFilterByDay("All Days");
                setMinValue(0);
                setMaxValue(50);
              }}
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </div>

      <div className="heatmap-layout">
        {/* Main Heatmap Area */}
        <div className="heatmap-main">
          <div className="heatmap-title">
            {selectedStreams.length > 0
              ? `Stream Data by Hour and Day (${selectedStreams.join(", ")})`
              : "Data by Hour and Day (Week)"}
          </div>

          <div className="heatmap-grid">
            {/* Hour headers */}
            <div className="grid-cell header empty"></div>
            {hours.map((hour, index) => (
              <div key={index} className="grid-cell header hour-header">
                {hour}
              </div>
            ))}

            {/* Day rows */}
            {days.map((day, dayIndex) => (
              <React.Fragment key={day}>
                <div className="grid-cell header day-header">{day}</div>
                {hours.map((hour, hourIndex) => {
                  const value = heatmapData[day][hour];
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="grid-cell data-cell"
                      style={{
                        backgroundColor: getColorIntensity(value),
                        color: getTextColor(value),
                      }}
                    >
                      {value}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Data Intensity Legend */}
          <div className="traffic-intensity-legend">
            <div className="legend-title">Data Intensity</div>
            <div className="legend-gradient">
              <div className="gradient-bar"></div>
              <div className="legend-labels">
                <span>0</span>
                <span>13</span>
                <span>25</span>
                <span>38</span>
                <span>50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficHeatmap;
