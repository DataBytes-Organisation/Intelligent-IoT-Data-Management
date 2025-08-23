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

// import { useCorrelationMatrix } from '../hooks/useCorrelationMatrix.js';

const Dashboard = () => {
  const { data, loading, error } = useSensorData(true); // mock mode
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

  const handleSubmit = () => {
    console.log('Selected Time Range:', selectedTimeStart, '→', selectedTimeEnd);
    console.log('selectedInterval:', selectedInterval);
    console.log('Filtered Data:', filteredData);
  };

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <div>
      <div className='label-plate'>Hello World! I just came alive with this Sensor Data Set with 7 fields!!</div>
      <div className='dashboard-container'>
        <div className='label-plate'>
          Streams: {streamNames.map(s => s.name).join(', ')}
        </div>

        <div className='selector-grid'>      
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

        <div className='stream-stats'>
          {selectedStreams.map(stream => (
            <StreamStats key={stream} data={filteredData} stream={stream} />
          ))}
        </div>

        <div className="chart-container">
          <Chart data={filteredData} selectedStreams={selectedStreams} />
        </div>
      </div>
    </div>    
  );
};

export default Dashboard;
