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
//import { useCorrelationMatrix } from '../hooks/useCorrelationMatrix.js/index.js';

// Import the sidebar
import SideBar from "./SideBar.jsx";

const Dashboard = () => {
  const { data, loading, error } = useSensorData(true); // mock mode
  const streamNames = useStreamNames(data);
  const [startTime, endTime] = useTimeRange(data);
  const timeOptions = useTimeRange(data);
  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  //const correlation = useCorrelationMatrix(data, streamNames, startTime, endTime);
  const [selectedStreams, setSelectedStreams] = useState([]);
  
  const intervals = ['5min', '15min', '1h', '6h'];
  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  //  New state for active sensor selection
  const [activeSensor, setActiveSensor] = useState(null);

  //const [selectedTimeRange, setSelectedTimeRange] = useState(3600000); // 1 hour
  
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
    <div className="flex">
      {/* Sidebar on the left with interactive click handler */}
      <SideBar onSelect={setActiveSensor} />

      {/* existing dashboard */}
      <div className="flex-1">
        <div className='label-plate'>
          Hello World! I just came alive with this Sensor Data Set with 7 fields!!
        </div>

        {/* Shows currently selected sensor if chosen */}
        <div className='label-plate'>
          {activeSensor
            ? `Currently Viewing: ${activeSensor.name}`
            : `Streams: ${streamNames.map(s => s.name).join(', ')}`}
        </div>

        <div className='dashboard-container'>
          <div className='selector-grid '>      
            <div className='selector-group card'>
              <StreamSelector 
                data={data}
                // streams={streamNames}
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

            {selectedStreams.length > 2 && (
              <MostCorrelatedPair data={filteredData} streams={selectedStreams} />
            )}
          </div>

          <div className="chart-container">
            <Chart data={filteredData} selectedStreams={selectedStreams} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
