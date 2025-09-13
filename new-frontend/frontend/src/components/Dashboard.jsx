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
  const [startTime, endTime] = useTimeRange(data);
  const timeOptions = useTimeRange(data);
  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  //const correlation = useCorrelationMatrix(data, streamNames, startTime, endTime);
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

  
  console.log('selectedInterval:', selectedInterval);
  // You can filter data, send to backend, or trigger chart updates

  console.log('Filtered Data:', filteredData);
  
 
};

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

  return (
<div >

  <div className='info-plate'>
    <h3>Note: </h3>
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
      
      Data Points in Selected Range: {filteredData.length} 
    </h3>
  </div>
  <div className='dashboard-container'>
    <div className='label-plate'>Streams: {streamNames.map(s => s.name).join(', ')}   
    </div>


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
            {/* this button for future use */}
          <div className='button'>
          <button onClick={handleSubmit}>Analyse Time Range</button>
          </div>           
        </div>
      </div>
    </div> 
{/* add some space here */}
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
        {/* <p>Note: If no scatter plot is shown, it means there is not enough data to display it.</p> */}

        
        <ScatterPlot data={filteredData}
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
  </div> 
     
  <div className="chart-container">
    <Chart data={filteredData} selectedStreams={selectedStreams} />
  </div>

</div>           
  );
};

export default Dashboard;
