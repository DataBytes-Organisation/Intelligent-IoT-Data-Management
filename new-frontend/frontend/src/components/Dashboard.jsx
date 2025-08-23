import BasicLine from './BasicLine';
import SensorStreams from './SensorStreams';
import SingleLineChart from './SingleLineChart';
import LineChartComponent from './LineChartComponent';
//import Correlation from './Correlation';

import './Dashboard.css'; // Add styling here

// test

const streams = ['stream1', 'stream2', 'stream3'];



const multiStreamData = [
  { timestamp: '2025-07-01', stream1: 24, stream2: 35, stream3: 45 },
  { timestamp: '2025-07-02', stream1: 28, stream2: 30, stream3: 40 },
  { timestamp: '2025-07-03', stream1: 32, stream2: 33, stream3: 42 },
  { timestamp: '2025-07-04', stream1: 31, stream2: 36, stream3: 39 }
];

const sampleData = [
  { timestamp: '2025-07-01', value: 23 },
  { timestamp: '2025-07-02', value: 28 },
  { timestamp: '2025-07-03', value: 31 },
  { timestamp: '2025-07-04', value: 27 }
];

function Dashboard() {
  return (
    <div className="dashboard-container">
      
      <div className="dashboard-grid">
        <div className="card"><SensorStreams /></div>
        <div className="card"><BasicLine /></div>
        <div className="card"><SingleLineChart data={sampleData}/></div>
        <div className="card"><LineChartComponent data={multiStreamData} streamKeys={streams} /></div>
      </div>
    </div>
  );
}

export default Dashboard;



