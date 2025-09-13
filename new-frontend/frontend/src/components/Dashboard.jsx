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
import RealTimeData from './RealTimeData.jsx';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('static'); // 'static' or 'realtime'
  const [useApiMode, setUseApiMode] = useState(false); // Toggle between API and mock mode
  const { data, loading, error } = useSensorData(!useApiMode); // Use API when useApiMode is true
  const streamNamesResult = useStreamNames(data, useApiMode);
  const streamNames = useApiMode ? streamNamesResult.streamNames : streamNamesResult;
  const [startTime, endTime] = useTimeRange(data);
  const timeOptions = useTimeRange(data);
  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);

  const intervals = ['5min', '15min', '1h', '6h'];
  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  const filteredDataResult = useFilteredData(data, {
    startTime: selectedTimeStart,
    endTime: selectedTimeEnd,
    selectedStreams,
    interval: selectedInterval
  }, useApiMode);
  
  const filteredData = useApiMode ? filteredDataResult.filteredData : filteredDataResult;

  const streamCount = selectedStreams.length;

  const handleSubmit = () => {
    console.log('Selected Time Range:', selectedTimeStart, '→', selectedTimeEnd);
    console.log('selectedInterval:', selectedInterval);
    console.log('Filtered Data:', filteredData);
  };

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data: {error}</p>;

  return (
    <div>
      <div className='info-plate'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>IoT Data Management Platform</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setActiveTab('static')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'static' ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📊 Static Analysis
            </button>
            <button 
              onClick={() => setActiveTab('realtime')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'realtime' ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📡 Real-time Streaming
            </button>
            <button 
              onClick={() => setUseApiMode(!useApiMode)}
              style={{
                padding: '8px 16px',
                backgroundColor: useApiMode ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {useApiMode ? 'API Mode' : 'Mock Mode'}
            </button>
          </div>
        </div>
        <ol>
          <li>Select at least one stream to view the line chart.</li>
          <li>Select two streams to see their scatter plot with a trendline, their correlation coefficient, and a rolling correlation line plot in the time interval using the selected time-window.</li>
          <li>Select at least three streams and a time range, to see which two streams are the most correlated in the selected time range, their scatter plot with a trendline.</li>
          
          <li>If no scatter plot is shown, it means there is not enough variance in the data during the selected time range.</li>
          <li>If no rolling correlation line is shown, it means there is not enough variance in the data during the selected time range.</li>
          <li>If no meaningful scatter plot is available for the most correlated pair, it means one or both streams lack variance in the selected time range.</li>
          <li>If no time range is selected, the entire dataset is used.</li>
        </ol>
      
        <h3> Total Data Points in Dataset: {data.length} | 
          
          Data Points in Selected Range: {useApiMode ? (filteredDataResult.filteredData?.length || 0) : filteredData.length} 
        </h3>
      </div>

      {/* Tab Content */}
      {activeTab === 'realtime' ? (
        <RealTimeData />
      ) : (
        <div className='dashboard-container'>
          <div className='label-plate'>Streams: {streamNames.map(s => s.name).join(', ')}   
          </div>

          <div className='selector-grid '>      
            <div className='selector-group card'>
              <StreamSelector 
                data={data}
                selectedStreams={selectedStreams}
                setSelectedStreams={setSelectedStreams}
              />
            </div>
            <div className='selector-group card'> 
              <IntervalSelector
                intervals={intervals}
                selectedInterval={selectedInterval}
                setSelectedInterval={setSelectedInterval}
              />
            </div>
                      
            <div className='selector-group card'>
              <h3>Time Range Selection</h3>
              <div className='card-content'>
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
                <div className='button'>
                  <button onClick={handleSubmit}>Analyse Time Range</button>
                </div>           
              </div>
            </div>
          </div> 
          
          <p></p>
          
          {streamCount === 0 && (
            <div className='empty-state'>
              <h3>Please select one or more streams to view statistics and charts.</h3>
            </div>
          )}
          
          {streamCount === 1 && (
            <div className='single-stream-block'>
              <h3>Selected one stream to see their scatter plot. Select another stream to explore correlations.</h3>
            </div>
          )}
          
          {streamCount === 2 && (
            <div className='pair-stream-block'>
              <h4>Selected two streams to see their scatter plot and rolling correlation. Select one more stream to see the most correlated pair among the selected streams.</h4>
              <ScatterPlot 
                data={filteredData}
                streams={selectedStreams}
                title={`Scatter Plot of selected two streams: `}
              />
            </div>
          )}

          {streamCount > 2 && (
            <div className='multi-stream-block'>
              <h3>Selected {streamCount} streams.</h3>
              <MostCorrelatedPair data={filteredData} streams={selectedStreams}  />
              <p>Note: If no scatter plot is shown, it means there is not enough variance in the data during the selected time range.</p>
            </div>
          )}

          <div>         
            <div className='stream-stats'>
              {selectedStreams.map(stream => (
                <StreamStats key={stream} data={filteredData} stream={stream} />
              ))}
            </div>
          </div>    
          
          <div className="chart-container">
            <Chart data={filteredData} selectedStreams={selectedStreams} />
          </div>
        </div>
      )}
    </div>           
  );
};

export default Dashboard;