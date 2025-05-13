import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RealTimeGraph = ({
  selectedStreams,
  timeRange,
  sensorFilter,
  valueThreshold,
}) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Sensor Value",
        data: [],
        borderColor: "rgb(0, 123, 255)",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2,
      },
    ],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
      const newValue = Math.floor(Math.random() * 30) + 20; // Simulated value

      setChartData((prev) => {
        const updatedLabels = [...prev.labels, timeLabel].slice(-10);
        const updatedData = [...prev.datasets[0].data, newValue].slice(-10);

        return {
          labels: updatedLabels,
          datasets: [
            {
              ...prev.datasets[0],
              data: updatedData,
            },
          ],
        };
      });
    }, 2000);

    return () => clearInterval(interval); // Cleanup
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide default legend
      },
    },
  };

  return (
    <div>
      {/* Custom Legend Styled Like Live Stream */}
      <div
        className="custom-legend"
        style={{ fontWeight: "bold", marginBottom: "10px" }}
      >
        📡 Sensor Stream {sensorFilter ? `(${sensorFilter})` : ""}
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RealTimeGraph;
