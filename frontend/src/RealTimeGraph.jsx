// RealTimeGraph.jsx
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RealTimeGraph = () => {
  const [data, setData] = useState({
    labels: [],  // x-axis labels
    datasets: [
      {
        label: 'Real-Time Data',
        data: [], // y-axis data points
        borderColor: 'rgb(75, 192, 192)',
        fill: false,
      },
    ],
  });

  // Fetch real-time data
  const fetchData = async () => {
    try {
      const response = await axios.get('https://your-api-endpoint.com/data');
      return response.data; // Ensure the response contains the necessary data for the graph
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const newData = await fetchData();
      setData((prevData) => {
        const newLabels = [...prevData.labels, new Date().toLocaleTimeString()];
        const newDataSet = [...prevData.datasets[0].data, newData];

        // Ensure the graph shows only the last 10 points for clarity
        if (newLabels.length > 10) {
          newLabels.shift();
          newDataSet.shift();
        }

        return {
          labels: newLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: newDataSet,
            },
          ],
        };
      });
    }, 2000); // Update every 2 seconds

    // Clear interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-Time Data Graph',
      },
    },
  };

  return (
    <div>
      <Line data={data} options={options} />
    </div>
  );
};

export default RealTimeGraph;
