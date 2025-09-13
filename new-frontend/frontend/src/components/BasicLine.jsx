
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const data = {
  labels: ['2025-07-01', '2025-07-02', '2025-07-03'],
  datasets: [{
    label: 'Sensor Data',
    data: [10, 20, 15],
    borderColor: '#36A2EB',
    fill: false,
  }],
};

function BasicLine() {
  return <Line data={data} />;
}

export default BasicLine;