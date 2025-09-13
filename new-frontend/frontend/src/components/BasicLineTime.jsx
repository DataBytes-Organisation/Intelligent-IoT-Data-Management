import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const data = {
  labels: ['2025-07-01T00:00:00Z', '2025-07-02T00:00:00Z', '2025-07-03T00:00:00Z'],
  datasets: [{
    label: 'Sensor Data',
    data: [10, 20, 15],
    borderColor: '#36A2EB',
    fill: false,
  }],
};

const options = {
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day'
      }
    }
  }
};

function BasicLineTime() {
  return <Line data={data} options={options} />;
}

export default BasicLineTime;