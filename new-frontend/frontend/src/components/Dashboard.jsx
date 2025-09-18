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

const Dashboard = () => {
  const { data, loading, error } = useSensorData(true); // mock mode
  const streamNames = useStreamNames(data);
  const [/*startTime*/, /*endTime*/] = useTimeRange(data);
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
    interval: selectedInterval,
  });

  const streamCount = selectedStreams.length;

  const handleSubmit = () => {
    console.log('Selected Time Range:', selectedTimeStart, '→', selectedTimeEnd);
    console.log('selectedInterval:', selectedInterval);
    console.log('Filtered Data:', filteredData);
  };

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <div>
      <div className="info-plate">
        <h3>Note: </h3>
        <ol>
          <li>Select at least one stream to view the line chart.</li>
          <li>
            Select two streams to see their scatter plot with a trendline, their
            correlation coefficient, and a rolling correlation line plot in the
            selected time-window.
          </li>
          <li>
            Select at least three streams and a time range to see the most
            correlated pair in that range and their scatter plot.
          </li>
          <li>
            If no scatter/rolling correlation appears, there may not be enough
            variance in the selected time range.
          </li>
          <li>If no time range is selected, the entire dataset is used.</li>
        </ol>

        <h3>
          Total Data Points in Dataset: {data.length} | Data Points in Selected
          Range: {filteredData.length}
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

        <p />

        {streamCount === 0 && (
          <div className="empty-state">
            <h3>
              Please select one or more streams to view statistics and charts.
            </h3>
          </div>
        )}

        {streamCount === 1 && (
          <div className="single-stream-block">
            <h3>
              Selected one stream. Select another stream to explore
              correlations.
            </h3>
          </div>
        )}

        {streamCount === 2 && (
          <div className="pair-stream-block">
            <h4>
              Selected two streams: scatter plot and rolling correlation below.
              Add one more to compute the most correlated pair.
            </h4>

            <ScatterPlot
              data={filteredData}
              streams={selectedStreams}
              title="Scatter Plot of selected two streams:"
            />
          </div>
        )}

        {streamCount > 2 && (
          <div className="multi-stream-block">
            <h3>Selected {streamCount} streams.</h3>
            <MostCorrelatedPair
              data={filteredData}
              streams={selectedStreams}
            />
            <p>
              Note: If no scatter plot is shown, there may be insufficient
              variance in the selected time range.
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
