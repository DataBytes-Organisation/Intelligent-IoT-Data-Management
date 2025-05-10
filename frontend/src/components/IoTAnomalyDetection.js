import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";

// Sample data and correlation analysis logic would be integrated later
const IoTAnomalyDetection = () => {
  const [timeframe, setTimeframe] = useState("");
  const [dataStreams, setDataStreams] = useState([]);
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    // Placeholder: Load the dataset or API endpoint for real-time streams
    setDataStreams(["Stream 1", "Stream 2", "Stream 3"]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = analyzeData(selectedStreams, timeframe);
    setChartData(data.chart);
    setAnomalies(data.anomalies);
  };

  // Analyze data by detecting correlations and anomalies
  const analyzeData = (selectedStreams, timeframe) => {
    // Placeholder: Replace this mock logic with AI-based anomaly detection logic
    let anomaliesDetected = [];
    let chart = {
      labels: ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM"],
      datasets: selectedStreams.map((stream, index) => ({
        label: stream,
        data: [20, 30, 25, 35, 40, 45, 50].map((value) => value + Math.random() * 5), // Simulated slight deviations
        borderColor: `rgba(${index * 50}, ${133 + index * 20}, 244, 0.8)`,
        backgroundColor: `rgba(${index * 50}, ${133 + index * 20}, 244, 0.2)`,
        fill: true,
      })),
    };

    // Mock anomaly detection based on deviation threshold (this should be replaced with actual AI logic)
    selectedStreams.forEach((stream, index) => {
      anomaliesDetected.push({ stream, anomaly: `Detected anomaly in ${stream}` });
    });

    return { chart, anomalies: anomaliesDetected };
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-24 text-center">
        <h1 className="text-5xl font-bold">IoT Anomaly Detection</h1>
        <p className="text-xl mt-4">
          Monitor sensor data and detect correlations between multiple data streams to ensure reliability and security.
        </p>
        <a href="#cta" className="mt-6 inline-block bg-yellow-300 text-gray-900 px-6 py-3 text-lg font-medium rounded hover:bg-gray-700 hover:text-yellow-300 transition">
          Get Started
        </a>
      </header>

      {/* Features */}
      <section className="py-16 bg-gray-800 text-center">
        <h2 className="text-4xl font-semibold text-yellow-300">Features</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10 px-6">
          {[
            { title: "Real-Time Monitoring", text: "Monitor multiple sensor data streams in real-time." },
            { title: "Anomaly Detection", text: "Detect anomalies by identifying deviations from expected correlations." },
            { title: "Correlation Analysis", text: "Analyze relationships between different data streams over time." },
          ].map((feature, index) => (
            <div key={index} className="bg-gray-700 p-6 rounded-lg hover:-translate-y-2 transition">
              <h3 className="text-2xl font-bold text-yellow-300 mb-3">{feature.title}</h3>
              <p className="text-lg">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Selection */}
      <section id="cta" className="py-16 text-center">
        <h2 className="text-3xl font-bold text-yellow-300">Select Data Streams and Time Frame</h2>
        <form onSubmit={handleSubmit} className="mt-6 max-w-md mx-auto">
          <div className="mb-4">
            <label className="block text-lg mb-2">Choose Data Streams</label>
            <select multiple className="block w-full p-3 rounded text-gray-900" onChange={(e) => setSelectedStreams([...e.target.selectedOptions].map(o => o.value))}>
              {dataStreams.map((stream, index) => (
                <option key={index} value={stream}>{stream}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-lg mb-2">Choose Time Frame</label>
            <select className="block w-full p-3 rounded text-gray-900" onChange={(e) => setTimeframe(e.target.value)}>
              <option value="">Select Time Frame</option>
              <option value="1">Day</option>
              <option value="2">Week</option>
              <option value="3">Month</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-yellow-300 text-gray-900 p-3 rounded font-bold hover:bg-gray-700 hover:text-yellow-300 transition">
            Analyze Data
          </button>
        </form>
      </section>

      {/* Data Graphs */}
      <section className="py-16 text-center bg-gray-800">
        <h2 className="text-4xl font-semibold text-yellow-300">Data Analysis</h2>
        <div className="mt-6 mx-auto max-w-3xl">
          {chartData ? <Line data={chartData} /> : <p>Select data streams and a time frame to display the graphs.</p>}
        </div>
      </section>

      {/* Anomalies */}
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold text-yellow-300">Detected Anomalies</h2>
        <div className="mt-6">
          {anomalies.length > 0 ? (
            <ul className="list-none">
              {anomalies.map((anomaly, index) => (
                <li key={index} className="bg-red-600 text-white p-4 rounded mb-4">
                  {anomaly.anomaly}
                </li>
              ))}
            </ul>
          ) : (
            <p>No anomalies detected.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center bg-gray-800 text-yellow-300">
        <p>&copy; 2025 IoT Anomaly Detection. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default IoTAnomalyDetection;