import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RealTimeGraph = () => {
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Real-Time Data',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  });

  const fetchData = async () => {
    try {
      const response = await axios.get('https://your-api-endpoint.com/data');
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const newData = await fetchData();
      setData((prev) => {
        const labels = [...prev.labels, new Date().toLocaleTimeString()].slice(-10);
        const dataset = [...prev.datasets[0].data, newData].slice(-10);
        return {
          ...prev,
          labels,
          datasets: [{ ...prev.datasets[0], data: dataset }],
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default RealTimeGraph;
