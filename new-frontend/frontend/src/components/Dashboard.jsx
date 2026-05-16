import React, { useState } from 'react';
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
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const Dashboard = () => {
  const { data, loading, error } = useSensorData(true);
  const streamNames = useStreamNames(data);
  const [startTime, endTime] = useTimeRange(data);
  const timeOptions = useTimeRange(data);

  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);

  const intervals = ['5min', '15min', '1h', '6h'];
  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  const filteredData = useFilteredData(data, {
    startTime: selectedTimeStart,
    endTime: selectedTimeEnd,
    selectedStreams,
    interval: selectedInterval
  });

  const streamCount = selectedStreams.length;

  const handleSubmit = () => {
    console.log('Selected Time Range:', selectedTimeStart, '→', selectedTimeEnd);
    console.log('Selected Interval:', selectedInterval);
    console.log('Filtered Data:', filteredData);
  };

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-top-profile">
        <Link to="/profile-settings" className="dashboard-profile-link">
        <User size={26} />
        </Link>
      </div>
      

      <div className="info-plate">
        <h3>Note:</h3>
        <ol>
          <li>Select at least one stream to view the line chart.</li>
          <li>Select two streams to see their scatter plot with a trendline and correlation result.</li>
          <li>Select at least three streams and a time range to see the most correlated pair in the selected time range.</li>
          <li>If no scatter plot is shown, it means there is not enough variance in the data during the selected time range.</li>
          <li>If no time range is selected, the entire dataset is used.</li>
        </ol>

        <h3>
          Total Data Points in Dataset: {data.length} | Data Points in Selected Range: {filteredData.length}
        </h3>
      </div>

      <div className="dashboard-container">
        <div className="label-plate">
          Streams: {streamNames.map((s) => s.name).join(', ')}
        </div>

        <div className="selector-grid">
          <div className="selector-group card">
            <StreamSelector
              data={data}
              selectedStreams={selectedStreams}
              setSelectedStreams={setSelectedStreams}
            />
          </div>

          <div className="selector-group card">
            <IntervalSelector
              intervals={intervals}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />
          </div>

          <div className="selector-group card">
            <h3>Time Range Selection</h3>

            <div className="card-content">
              <div>
                <TimeSelector
                  label="Start Time"
                  timeOptions={timeOptions}
                  selectedTime={selectedTimeStart}
                  setSelectedTime={setSelectedTimeStart}
                />
              </div>

              <div>
                <TimeSelector
                  label="End Time"
                  timeOptions={timeOptions}
                  selectedTime={selectedTimeEnd}
                  setSelectedTime={setSelectedTimeEnd}
                />
              </div>

              <div className="button">
                <button onClick={handleSubmit}>Analyse Time Range</button>
              </div>
            </div>
          </div>
        </div>

        {streamCount === 0 && (
          <div className="empty-state result-card">
            <h3>No streams selected</h3>
            <p>
              Choose one or more sensor streams from the selector above to view statistics and time-series charts.
            </p>
          </div>
        )}

        {streamCount === 1 && (
          <div className="single-stream-block result-card">
            <h3>Select one more stream to explore correlation between streams.</h3>
          </div>
        )}

        {streamCount === 2 && (
          <div className="pair-stream-block result-card">
            <h3>Correlation Analysis Result</h3>
            <p className="result-text">
              The result below shows the relationship between the two selected streams.
            </p>

            <ScatterPlot
              data={filteredData}
              streams={selectedStreams}
              title="Scatter Plot of Selected Streams"
            />
          </div>
        )}

        {streamCount > 2 && (
          <div className="multi-stream-block result-card">
            <h3>Correlation Analysis Result</h3>
            <p className="result-text">
              The system has selected the strongest correlated pair from the chosen streams.
            </p>

            <MostCorrelatedPair data={filteredData} streams={selectedStreams} />

            <p className="result-note">
              Note: If no scatter plot is shown, it means there is not enough variance in the data during the selected time range.
            </p>
          </div>
        )}

        <div className="stream-stats">
          {selectedStreams.map((stream) => (
            <StreamStats key={stream} data={filteredData} stream={stream} />
          ))}
        </div>
      </div>

      <div className="chart-container">
        <Chart data={filteredData} selectedStreams={selectedStreams} />
      </div>
    </div>
  );
};

export default Dashboard;