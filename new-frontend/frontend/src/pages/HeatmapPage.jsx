import React, { useState } from "react";
import TrafficHeatmap from "../components/TrafficHeatmap";
import { useSensorData } from "../hooks/useSensorData";
import { useFilteredData } from "../hooks/useFilteredData";
import { useStreamNames } from "../hooks/useStreamNames";
import "./HeatmapPage.css";
function HeatmapPage() {
  const { data, loading, error } = useSensorData(true); // mock mode
  const streamNames = useStreamNames(data);
  const [selectedStreams, setSelectedStreams] = useState([]);

  const filteredData = useFilteredData(data, {
    selectedStreams,
  });

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

  const selectAll = () => {
    if (streamNames) {
      setSelectedStreams(streamNames.map((stream) => stream.id));
    }
  };
  const clearAll = () => {
    setSelectedStreams([]);
  };

  return (
    <div className="heatmap-page-container">
      <div className="stream-selection-card">
        <div className="stream-selection-header">
          <div className="header-left">
            <div className="header-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <div>
              <h2 className="header-title">Stream Selection for Heatmap</h2>
              <p className="header-description">
                Select one or more streams to visualize in the heatmap below:
              </p>
            </div>
          </div>
          <div className="header-buttons">
            <button onClick={selectAll} className="btn-select-all">
              Select All
            </button>
            <button onClick={clearAll} className="btn-clear">
              Clear
            </button>
          </div>
        </div>

        <div className="checkbox-grid">
          {streamNames &&
            streamNames.map((stream) => (
              <label key={stream.id} className="checkbox-item">
                <input
                  type="checkbox"
                  value={stream.id}
                  checked={selectedStreams.includes(stream.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStreams([...selectedStreams, stream.id]);
                    } else {
                      setSelectedStreams(
                        selectedStreams.filter((id) => id !== stream.id)
                      );
                    }
                  }}
                />
                <span className="checkbox-label">#{stream.name}</span>
              </label>
            ))}
        </div>

        {selectedStreams.length > 0 && (
          <div className="selected-streams-display">
            <p className="selected-streams-title">
              Selected streams ({selectedStreams.length}):
            </p>
            <div className="selected-streams-list">
              {selectedStreams.map((id) => (
                <span key={id} className="selected-stream-tag">
                  #{streamNames?.find((stream) => stream.id === id)?.name || id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <TrafficHeatmap
        streamData={filteredData}
        selectedStreams={selectedStreams}
      />
    </div>
  );
}

export default HeatmapPage;
